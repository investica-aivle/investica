import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

export interface PerplexityConversionResult {
  markdown: string;
  fileName: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class PerplexityPdfConverterService {
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
   * PDF 파일을 마크다운으로 변환
   */
  async convertPdfToMarkdown(
    pdfFilePath: string,
    outputDir: string = "./downloads/markdown",
  ): Promise<PerplexityConversionResult> {
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
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // PDF 파일 읽기
      const pdfBuffer = fs.readFileSync(pdfFilePath);
      const fileName = path.basename(pdfFilePath, ".pdf");
      const markdownFileName = `${fileName}.md`;
      const markdownFilePath = path.join(outputDir, markdownFileName);

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`PDF 변환 실패: ${errorMessage}`);

      return {
        markdown: "",
        fileName: "",
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 여러 PDF 파일을 일괄 변환
   */
  async convertMultiplePdfsToMarkdown(
    pdfFilePaths: string[],
    outputDir: string = "./downloads/markdown",
  ): Promise<PerplexityConversionResult[]> {
    const results: PerplexityConversionResult[] = [];

    for (const pdfFilePath of pdfFilePaths) {
      try {
        const result = await this.convertPdfToMarkdown(pdfFilePath, outputDir);
        results.push(result);
        console.log(`변환 완료: ${pdfFilePath} -> ${result.fileName}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`변환 실패: ${pdfFilePath} - ${errorMessage}`);
        results.push({
          markdown: "",
          fileName: "",
          success: false,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  /**
   * 다운로드된 PDF를 자동으로 마크다운으로 변환
   */
  async convertDownloadedPdfToMarkdown(
    pdfFilePath: string,
    outputDir: string = "./downloads/markdown",
  ): Promise<PerplexityConversionResult> {
    return this.convertPdfToMarkdown(pdfFilePath, outputDir);
  }
}
