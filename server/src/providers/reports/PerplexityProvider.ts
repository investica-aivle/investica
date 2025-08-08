import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

import {
  MarkdownSummaryResult,
  PdfConversionResult,
} from "../../models/Reports";

/**
 * Perplexity PDF Converter Provider
 *
 * Perplexity AI API를 사용하여 변환하는 기능을 제공합니다.
 * 내부적으로 사용되는 Provider입니다.
 */
@Injectable()
export class PerplexityProvider {
  private readonly perplexityApiUrl =
    "https://api.perplexity.ai/chat/completions";
  private readonly apiKey?: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    if (!this.apiKey) {
      console.warn(
        "PERPLEXITY_API_KEY not properly configured, PDF conversion will be disabled",
      );
    }
  }

  /**
   * PDF 파일이 있는데 MD 파일이 없는 경우에만 변환
   */
  public async convertDownloadedPdfToMarkdown(
    pdfFolderPath: string,
    mdFolderPath: string = "./downloads/markdown",
  ): Promise<PdfConversionResult[]> {
    const results: PdfConversionResult[] = [];

    // PDF는 있지만 MD가 없는 파일들 찾기
    const missingMarkdownFiles = this.findMissingMarkdownFiles(
      pdfFolderPath,
      mdFolderPath,
    );

    // 누락된 파일들 변환
    for (const pdfFile of missingMarkdownFiles) {
      console.log(`Converting missing markdown for: ${pdfFile}.pdf`);
      const pdfFilePath = path.join(pdfFolderPath, `${pdfFile}.pdf`);
      const result = await this.convertPdfToMarkdown(pdfFilePath, mdFolderPath);
      results.push(result);
    }

    return results;
  }

  /**
   * 최신마크다운문서들을 확인하고 요약
   */
  public async summarizeLatestMarkdownFiles(
    markdownDir: string = "./downloads/markdown",
    limit: number = 5,
  ): Promise<MarkdownSummaryResult> {
    try {
      // 1. 마크다운 파일들 읽기 및 정렬
      const sortedFiles = this.readAndSortMarkdownFiles(markdownDir, limit);

      if (sortedFiles.length === 0) {
        return {
          message: "요약할 마크다운 파일이 없습니다.",
          summary: "",
          referencedFiles: [],
        };
      }

      // 2. 파일 내용 읽기
      const fileContents = this.readMarkdownFileContents(sortedFiles);

      if (fileContents.length === 0) {
        return {
          message: "마크다운 파일을 읽을 수 없습니다.",
          summary: "",
          referencedFiles: [],
        };
      }

      // 3. AI 요약 요청
      const summary = await this.requestAISummary(fileContents);

      return {
        message: `${fileContents.length}개의 최신 마크다운 파일이 성공적으로 요약되었습니다.`,
        summary,
        referencedFiles: this.createReferencedFiles(sortedFiles, fileContents),
      };
    } catch (error) {
      console.error("Error summarizing markdown files:", error);
      return {
        message: `요약 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        summary: "",
        referencedFiles: [],
      };
    }
  }

  /**
   * PDF는 있지만 MD가 없는 파일들 찾기
   */
  private findMissingMarkdownFiles(
    pdfFolderPath: string,
    mdFolderPath: string,
  ): string[] {
    // PDF 파일들 읽기
    const pdfFiles = fs
      .readdirSync(pdfFolderPath)
      .filter((file) => file.endsWith(".pdf"))
      .map((file) => path.basename(file, ".pdf"));

    // MD 파일들 읽기
    const mdFiles = fs.existsSync(mdFolderPath)
      ? fs
          .readdirSync(mdFolderPath)
          .filter((file) => file.endsWith(".md"))
          .map((file) => path.basename(file, ".md"))
      : [];

    // PDF는 있지만 MD가 없는 파일들 찾기
    const missingFiles: string[] = [];
    for (const pdfFile of pdfFiles) {
      if (!mdFiles.includes(pdfFile)) {
        missingFiles.push(pdfFile);
      } else {
        console.log(`Markdown already exists for: ${pdfFile}.pdf, skipping...`);
      }
    }

    return missingFiles;
  }

  /**
   * 마크다운 파일들 읽기 및 날짜순 정렬
   */
  private readAndSortMarkdownFiles(markdownDir: string, limit: number) {
    if (!fs.existsSync(markdownDir)) {
      return [];
    }

    return fs
      .readdirSync(markdownDir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => ({
        fileName: file,
        filePath: path.join(markdownDir, file),
        date: this.extractDateFromFileName(file),
        title: this.extractTitleFromFileName(file),
      }))
      .filter((file) => file.date !== null) // 날짜 추출 실패한 파일 제외
      .sort((a, b) => b.date!.getTime() - a.date!.getTime()) // 최신순 정렬
      .slice(0, limit); // 최근 n개만 선택
  }

  /**
   * 마크다운 파일 내용 읽기
   */
  private readMarkdownFileContents(
    sortedFiles: Array<{
      fileName: string;
      filePath: string;
      date: Date | null;
      title: string;
    }>,
  ) {
    const fileContents = [];

    for (const file of sortedFiles) {
      try {
        const content = fs.readFileSync(file.filePath, "utf8");
        const truncatedContent = content.substring(0, 2000); // 내용 길이 제한

        fileContents.push({
          fileName: file.fileName,
          content: truncatedContent,
        });
      } catch (error) {
        console.error(`Error reading file ${file.fileName}:`, error);
      }
    }

    return fileContents;
  }

  /**
   * AI 요약 요청
   */
  private async requestAISummary(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const summaryPrompt = this.createSummaryPrompt(fileContents);

    const response = await axios.post(
      this.perplexityApiUrl,
      {
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.choices[0].message.content;
  }

  /**
   * 요약 프롬프트 생성
   */
  private createSummaryPrompt(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    return `다음 ${fileContents.length}개의 최신 증권보고서들을 요약해줘:

${fileContents
  .map(
    (file, index) => `
**${index + 1}. ${file.fileName}**
${file.content.substring(0, 500)}...
`,
  )
  .join("\n")}

위 보고서들의 주요 내용을 종합적으로 요약해주세요. 다음 사항들을 포함해주세요:
1. 전체적인 시장 동향
2. 주요 투자 포인트
3. 리스크 요인
4. 향후 전망

간결하고 명확하게 요약해주세요.`;
  }

  /**
   * 참조 파일 목록 생성
   */
  private createReferencedFiles(
    sortedFiles: Array<{
      fileName: string;
      filePath: string;
      date: Date | null;
      title: string;
    }>,
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const referencedFiles = [];

    for (const file of sortedFiles) {
      const content = fileContents.find((fc) => fc.fileName === file.fileName);
      if (content) {
        referencedFiles.push({
          fileName: file.fileName,
          date: file.date!.toISOString().split("T")[0], // YYYY-MM-DD 형식
          title: file.title || file.fileName,
          content: content.content,
        });
      }
    }

    return referencedFiles;
  }

  /**
   * 파일명에서 날짜 추출 (yyyymmdd_title_id 형식)
   */
  private extractDateFromFileName(fileName: string): Date | null {
    try {
      // yyyymmdd_title_id.md 형식에서 날짜 부분 추출
      const match = fileName.match(/^(\d{8})_/);
      if (match) {
        const dateStr = match[1];
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1; // 월은 0부터 시작
        const day = parseInt(dateStr.substring(6, 8));

        return new Date(year, month, day);
      }
      return null;
    } catch (error) {
      console.error(`Error extracting date from filename ${fileName}:`, error);
      return null;
    }
  }

  /**
   * 파일명에서 제목 추출 (yyyymmdd_title_id 형식)
   */
  private extractTitleFromFileName(fileName: string): string {
    try {
      // yyyymmdd_title_id.md 형식에서 제목 부분 추출
      const match = fileName.match(/^\d{8}_(.+?)_\d+\.md$/);
      if (match) {
        return match[1].replace(/_/g, " "); // 언더스코어를 공백으로 변경
      }
      return fileName.replace(".md", ""); // 매치되지 않으면 확장자만 제거
    } catch (error) {
      console.error(`Error extracting title from filename ${fileName}:`, error);
      return fileName;
    }
  }

  /**
   * PDF 파일을 마크다운으로 변환
   */
  private async convertPdfToMarkdown(
    pdfFilePath: string,
    mdFolderPath: string = "./downloads/markdown",
  ): Promise<PdfConversionResult> {
    try {
      // API 키 확인
      if (!this.apiKey) {
        return {
          markdown: "",
          fileName: "",
          success: false,
          error: "PERPLEXITY_API_KEY not configured",
        };
      }

      // 출력 디렉토리 생성
      if (!fs.existsSync(mdFolderPath)) {
        fs.mkdirSync(mdFolderPath, { recursive: true });
      }
      console.log("convertPdfToMarkdown", pdfFilePath);
      // PDF 파일 읽기
      const pdfBuffer = fs.readFileSync(pdfFilePath);
      const fileName = path.basename(pdfFilePath, ".pdf");
      const markdownFileName = `${fileName}.md`;
      const markdownFilePath = path.join(mdFolderPath, markdownFileName);

      // Perplexity API에 파일 업로드하여 변환 요청
      const formData = new FormData();
      formData.append("file", new Blob([pdfBuffer]), `${fileName}.pdf`);

      const response = await axios.post(
        this.perplexityApiUrl,
        {
          model: "llama-3.1-sonar-large-128k-online",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `이 PDF 파일을 마크다운으로 변환해줘. 다음 조건을 지켜줘:

1. 최대한 정보를 만들지 말고 모든 정보를 반영해서 마크다운 파일로 만들어줘
2. 내용을 안 없애면 좋겠어
3. 표 형식은 마크다운의 표 형식으로 변환하는 등 최대한 PDF 구조를 그대로 반영해줘
4. 그래프 같은 것들이 있는 경우 각 그래프마다 간단하게 지표를 뽑아내거나 평가한 정보가 있으면 좋겠음

마크다운 형식으로만 응답해줘.`,
                },
                {
                  type: "file",
                  file: {
                    data: pdfBuffer.toString("base64"),
                    mime_type: "application/pdf",
                    name: `${fileName}.pdf`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const markdownContent = response.data.choices[0].message.content;

      // 마크다운 파일 저장
      fs.writeFileSync(markdownFilePath, markdownContent, "utf8");

      return {
        markdown: markdownContent,
        fileName: markdownFileName,
        success: true,
      };
    } catch (error) {
      console.error("Error converting PDF to Markdown:", error);
      return {
        markdown: "",
        fileName: "",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
