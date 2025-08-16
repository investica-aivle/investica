import { GoogleGenerativeAI } from "@google/generative-ai";
import PdfConversionResult, {
  MiraeAssetReport,
  ReportsJsonData,
} from "@models/Reports";
import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

/**
 * Report AI Provider
 *
 * Google Gemini AI를 사용하여 PDF를 마크다운으로 변환하는 기능을 제공합니다.
 * 내부적으로 사용되는 Provider입니다.
 */
@Injectable()
export class ReportAiProvider {
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>("GOOGLE_API_KEY");
    console.log(apiKey);
    if (!apiKey) {
      throw new InternalServerErrorException(
        "Google API Key not found in configuration.",
      );
    } else {
      console.log(`✅ GOOGLE_API_KEY 설정됨`);
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 최신 마크다운 파일들을 가져오기
   */
  public async getLatestMarkdownFiles(
    jsonFilePath: string = "./downloads/reports.json",
    limit: number = 5,
    options: {
      contentLengthLimit?: number;
      shouldLimitLength?: boolean;
    } = {},
  ): Promise<{
    limitedFiles: any[];
    fileContents: any[];
  }> {
    // 1. 마크다운 파일들 읽기 및 정렬
    const sortedFiles = this.getMarkdownFilesFromJson(jsonFilePath);

    if (sortedFiles.length === 0) {
      return {
        limitedFiles: [],
        fileContents: [],
      };
    }

    // 2. limit만큼 자르기
    const limitedFiles = sortedFiles.slice(0, limit);

    // 3. 파일 내용 읽기
    const fileContents = this.readLatestMarkdownFiles(limitedFiles, options);

    return {
      limitedFiles,
      fileContents,
    };
  }

  /**
   * 최신마크다운문서들을 확인하고 요약
   */
  public async summarizeLatestMarkdownFiles(
    jsonFilePath: string = "./downloads/reports.json",
    limit: number = 5,
  ): Promise<{
    message: string;
    summary: string;
    referencedFiles: Array<{
      fileName: string;
      date: string;
      title: string;
      content: string;
    }>;
  }> {
    try {
      console.log("summarizeLatestMarkdownFiles");

      const { limitedFiles, fileContents } = await this.getLatestMarkdownFiles(
        jsonFilePath,
        limit,
      );

      if (fileContents.length === 0) {
        return {
          message: "마크다운 파일이 없습니다.",
          summary: "",
          referencedFiles: [],
        };
      }

      // 3. AI 요약 요청
      const summary = await this.requestAISummary(fileContents);

      return {
        message: `${fileContents.length}개의 최신 마크다운 파일이 성공적으로 요약되었습니다.`,
        summary,
        referencedFiles: this.createReferencedFiles(limitedFiles, fileContents),
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
   * JSON 파일을 통해 마크다운 변환이 필요한 보고서들을 찾아서 변환
   */
  public async convertReportsFromJson(
    jsonFilePath: string = "./downloads/reports.json",
    mdFolderPath: string = "./downloads/markdown",
  ): Promise<PdfConversionResult[]> {
    console.log(`🔄 JSON 기반 마크다운 변환 시작`);
    console.log(`📄 JSON 파일: ${jsonFilePath}`);
    console.log(`📁 마크다운 폴더: ${mdFolderPath}`);

    const results: PdfConversionResult[] = [];

    try {
      // JSON 파일 읽기
      if (!fs.existsSync(jsonFilePath)) {
        console.log(`❌ JSON 파일이 없습니다: ${jsonFilePath}`);
        return results;
      }

      const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
      const reportsData: ReportsJsonData = JSON.parse(jsonContent);

      // mdFileName이 null인 보고서들 찾기
      const reportsNeedingConversion = reportsData.reports.filter(
        (report) => report.mdFileName === null,
      );

      console.log(`📋 변환할 보고서 개수: ${reportsNeedingConversion.length}`);

      // 출력 디렉토리 생성
      if (!fs.existsSync(mdFolderPath)) {
        fs.mkdirSync(mdFolderPath, { recursive: true });
      }

      // 각 보고서를 file_url로 변환
      for (const report of reportsNeedingConversion) {
        console.log(`\n🔄 변환 중: ${report.title}`);

        const result = await this.convertPdfFromUrl(
          report.downloadUrl,
          report.id, // pdfFileName 대신 id 사용
          mdFolderPath,
        );

        if (result.success) {
          console.log(`✅ 변환 성공: ${result.fileName}`);
        } else {
          console.log(`❌ 변환 실패: ${result.error}`);
        }

        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `\n📊 변환 결과: ${results.length}개 중 ${successCount}개 성공`,
      );

      // JSON 파일 업데이트
      await this.updateReportsJsonFromResults(jsonFilePath, results);

      return results;
    } catch (error) {
      console.error(`❌ JSON 기반 변환 실패:`, error);
      return results;
    }
  }

  /**
   * JSON을 이용해서 마크다운 날짜순 정렬해서 리턴
   */
  public getMarkdownFilesFromJson(jsonFilePath: string): MiraeAssetReport[] {
    try {
      if (!fs.existsSync(jsonFilePath)) {
        console.log(`JSON 파일이 없습니다: ${jsonFilePath}`);
        return [];
      }

      const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
      const reportsData: ReportsJsonData = JSON.parse(jsonContent);

      // mdFileName이 있는 보고서들만 필터링하고 정렬
      const reportsWithMarkdown = reportsData.reports
        .filter((report) => report.mdFileName !== null)
        .filter((report) =>
          fs.existsSync(`./downloads/markdown/${report.mdFileName}`),
        ) // 실제 파일이 존재하는지 확인
        .sort((a, b) => {
          // 날짜순 정렬 (최신순)
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

      console.log(
        `JSON에서 ${reportsWithMarkdown.length}개의 마크다운 파일을 찾았습니다.`,
      );
      return reportsWithMarkdown;
    } catch (error) {
      console.error(`JSON에서 마크다운 파일 읽기 실패:`, error);
      return [];
    }
  }

  /**
   * 마크다운 파일 내용 읽기
   */
  public readLatestMarkdownFiles(
    sortedFiles: MiraeAssetReport[],
    options: {
      contentLengthLimit?: number;
      shouldLimitLength?: boolean;
    } = {},
  ) {
    const { contentLengthLimit = 2000, shouldLimitLength = true } = options;
    const fileContents = [];

    for (const file of sortedFiles) {
      try {
        if (!file.mdFileName) continue;

        const filePath = `./downloads/markdown/${file.mdFileName}`;
        const content = fs.readFileSync(filePath, "utf8");
        const finalContent = shouldLimitLength
          ? content.substring(0, contentLengthLimit)
          : content;

        fileContents.push({
          fileName: file.mdFileName,
          content: finalContent,
        });
      } catch (error) {
        console.error(`Error reading file ${file.mdFileName}:`, error);
      }
    }

    return fileContents;
  }

  /**
   * AI 요약 요청 (직접 API 사용)
   */
  private async requestAISummary(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const summaryPrompt = this.createSummaryPrompt(fileContents);
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    return response.text();
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

위 보고서들의 주요 내용을 종합적으로 요약해줘. 다음 사항들을 포함해주세요:
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
    sortedFiles: MiraeAssetReport[],
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const referencedFiles = [];

    for (const file of sortedFiles) {
      if (!file.mdFileName) continue;

      const content = fileContents.find(
        (fc) => fc.fileName === file.mdFileName,
      );
      if (content) {
        referencedFiles.push({
          fileName: file.mdFileName,
          date: file.date, // 이미 YYYY-MM-DD 형식
          title: file.title,
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

  private readonly tempDir = path.join(__dirname, "..", "..", "temp_files");

  /**
   * URL에서 PDF를 직접 변환 (file_url 사용)
   */
  public async convertPdfFromUrl(
    downloadUrl: string,
    pdfFileName: string,
    mdFolderPath: string,
  ): Promise<PdfConversionResult> {
    let tempPdfPath: string | null = null;
    try {
      // API 키 확인
      if (!this.genAI) {
        console.error("❌ Gemini API not configured");
        return {
          markdown: "",
          fileName: "",
          success: false,
          error: "Gemini API not configured",
        };
      }

      console.log(`🔄 URL에서 변환 시작: ${pdfFileName}`);
      console.log(`🌐 다운로드 URL: ${downloadUrl}`);

      const markdownFileName = `${pdfFileName.replace(".pdf", "")}.md`;
      const markdownFilePath = path.join(mdFolderPath, markdownFileName);

      tempPdfPath = await this.downloadPdf(downloadUrl);
      const pdfBuffer = fs.readFileSync(tempPdfPath);
      const base64Pdf = pdfBuffer.toString("base64");

      const filePart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf,
        },
      };

      const prompt = `
첨부된 PDF는 금융 보고서입니다.

이 문서의 내용을 가능한 한 정확하고 자세하게 쓰되 요약하여 정리하십시오.
보고서의 흐름과 세부 내용을 충실히 반영해 작성하십시오.
작성자의 해석이나 주관적 판단 없이, PDF에 포함된 내용을 기반으로 정리하십시오.
형식은 마크다운을 계층형식으로 작성하십시오.

그래프 같은 것 들이 있는 경우 각 그래프 마다 간단하게 지표를뽑아내거나 평가한정보가 있어야 함
제목이나 항목 구분 하며 본문 내용을 작성하십시오.

문서 외적인 설명, 요약, 해설, 주석은 포함하지 마십시오.
보고서 제목, 작성자, 날짜와 같은 부가 정보는 모두 제외하십시오.

결과는 아래 예시와 같이 **굵은 글씨**와 -을 활용한 리스트 형식으로 깔끔하게 정리하여야 함.

## 전세계 주식시장의 이익동향

    **전세계 12개월 선행 EPS** : 전월 대비 -0.1% 하락

    - 신흥국: -0.6%

    - 선진국: -0.01%

    - 국가별 변화

    - 상향 조정: 미국(+0.4%), 홍콩(+0.2%)

    - 하향 조정: 브라질(-2.0%), 일본(-1.2%), 중국(-0.9%)
            
`;
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      const result = await model.generateContent([prompt, filePart]);
      const response = result.response;
      const markdownContent = response.text();

      // 마크다운 파일 저장
      fs.writeFileSync(markdownFilePath, markdownContent, "utf8");
      console.log(`💾 마크다운 파일 저장 완료: ${markdownFilePath}`);

      return {
        markdown: markdownContent,
        fileName: markdownFileName,
        success: true,
      };
    } catch (error) {
      console.error(`❌ URL 변환 실패 (${pdfFileName}):`, error);
      return {
        markdown: "",
        fileName: "",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (tempPdfPath) {
        try {
          fs.unlinkSync(tempPdfPath);
        } catch (err: any) {
          console.error(`임시 파일 삭제 실패: ${tempPdfPath}`, err);
        }
      }
    }
  }

  private async downloadPdf(url: string): Promise<string> {
    const filename = `temp_document_${Date.now()}.pdf`;
    const outputPath = path.join(this.tempDir, filename);

    try {
      console.log(`PDF 다운로드 중: ${url}`);

      // httpService 사용
      const response = await this.httpService.axiosRef.get(url, {
        responseType: "arraybuffer",
      });

      if (response.status !== 200) {
        throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
      }

      fs.writeFileSync(outputPath, Buffer.from(response.data));
      console.log(`PDF 다운로드 완료: ${outputPath}`);
      return outputPath;
    } catch (error: any) {
      console.error(`PDF 다운로드 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException(
        `PDF 다운로드 실패: ${error.message}`,
      );
    }
  }

  /**
   * 변환 결과로 JSON 파일 업데이트
   */
  private async updateReportsJsonFromResults(
    jsonFilePath: string,
    conversionResults: PdfConversionResult[],
  ): Promise<void> {
    try {
      const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
      const reportsData: ReportsJsonData = JSON.parse(jsonContent);

      // 성공한 변환 결과들로 mdFileName 업데이트
      const successfulConversions = conversionResults.filter((r) => r.success);

      for (const conversion of successfulConversions) {
        const reportId = conversion.fileName.replace(".md", "");

        // reports 배열에서 해당 ID 찾아서 mdFileName 업데이트
        const reportIndex = reportsData.reports.findIndex(
          (report) => report.id === reportId,
        );

        if (reportIndex !== -1) {
          reportsData.reports[reportIndex].mdFileName = conversion.fileName;
        }
      }

      // 마크다운 변환 완료 시간 업데이트
      reportsData.lastMarkdownUpdate = new Date().toISOString();

      // JSON 파일 다시 저장
      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(reportsData, null, 2),
        "utf8",
      );
      console.log(
        `📄 JSON 파일 업데이트 완료: ${successfulConversions.length}개 마크다운 상태 반영`,
      );
    } catch (error) {
      console.error(`❌ JSON 파일 업데이트 실패:`, error);
    }
  }
}
