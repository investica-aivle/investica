import { Controller } from "@nestjs/common";

import {
  MiraeAssetReport,
  MiraeAssetScraperService,
} from "../../providers/reports/MiraeAssetScraperService";
import { PerplexityPdfConverterService } from "../../providers/reports/PerplexityPdfConverterService";

@Controller("reports-agent")
export class ReportsAgentController {
  constructor(
    private readonly miraeAssetScraperService: MiraeAssetScraperService,
    private readonly perplexityPdfConverterService: PerplexityPdfConverterService,
  ) {}

  /**
   * 최근 증권사 보고서 가져오기
   */
  async getLatestReports(
    keywords: string[] = ["Earnings Revision", "Credit Market Weekly"],
    limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      keywords,
      limit,
    );
  }

  async getEarningsRevisionReports(
    limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      ["Earnings Revision"],
      limit,
    );
  }

  async getCreditMarketWeeklyReports(
    limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      ["Credit Market Weekly"],
      limit,
    );
  }

  async downloadReport(
    downloadUrl: string,
    outputDir: string = "./downloads",
  ): Promise<{ filePath: string; success: boolean }> {
    try {
      const filePath = await this.miraeAssetScraperService.downloadPdf(
        downloadUrl,
        outputDir,
      );
      return { filePath, success: true };
    } catch (error) {
      return { filePath: "", success: false };
    }
  }

  /**
   * PDF를 마크다운으로 변환
   */
  async convertPdfToMarkdown(
    pdfFilePath: string,
    outputDir: string = "./downloads/markdown",
  ): Promise<{
    markdown: string;
    fileName: string;
    success: boolean;
    error?: string;
  }> {
    return await this.perplexityPdfConverterService.convertPdfToMarkdown(
      pdfFilePath,
      outputDir,
    );
  }

  /**
   * 보고서 다운로드 후 자동으로 마크다운 변환
   */
  async downloadAndConvertReport(
    downloadUrl: string,
    outputDir: string = "./downloads",
  ): Promise<{
    pdfFilePath: string;
    markdown: string;
    markdownFileName: string;
    success: boolean;
    error?: string;
  }> {
    try {
      // 1. PDF 다운로드
      const pdfFilePath = await this.miraeAssetScraperService.downloadPdf(
        downloadUrl,
        outputDir,
      );

      // 2. 마크다운으로 변환
      const conversionResult =
        await this.perplexityPdfConverterService.convertPdfToMarkdown(
          pdfFilePath,
          `${outputDir}/markdown`,
        );

      return {
        pdfFilePath,
        markdown: conversionResult.markdown,
        markdownFileName: conversionResult.fileName,
        success: conversionResult.success,
        error: conversionResult.error,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        pdfFilePath: "",
        markdown: "",
        markdownFileName: "",
        success: false,
        error: errorMessage,
      };
    }
  }
}
