import { Injectable } from "@nestjs/common";
import { ReportBaseProvider } from "./ReportBaseProvider";
import { ReportFileManager } from "./ReportFileManager";

@Injectable()
export class ReportSummarizer {
  constructor(
    private readonly baseProvider: ReportBaseProvider,
    private readonly fileManager: ReportFileManager,
  ) {}

  /**
   * 최신마크다운문서 Limit개 가져와 LLM 요약후 반환
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

      //JSON, {fileName, content}
      const { limitedFiles, fileContents } = this.fileManager.getLatestMarkdownFiles(
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
        referencedFiles: this.fileManager.createReferencedFiles(limitedFiles, fileContents),
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
   * AI 요약 요청 (직접 API 사용)
   */
  private async requestAISummary(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const summaryPrompt = this.createSummaryPrompt(fileContents);
    return this.baseProvider.callGenerativeModel(summaryPrompt);
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
    return `다음 ${fileContents.length}개의 최신 증권보고서들을 요약해줘:\n\n${fileContents
  .map(
    (file, index) => `\n**${index + 1}. ${file.fileName}**\n${file.content.substring(0, 500)}...\n`,
  )
  .join("\n")}\n\n위 보고서들의 주요 내용을 종합적으로 요약해주세요. 다음 사항들을 포함해주세요:\n1. 전체적인 시장 동향\n2. 주요 투자 포인트\n3. 리스크 요인\n4. 향후 전망\n\n간결하고 명확하게 요약해주세요.`;
  }
}
