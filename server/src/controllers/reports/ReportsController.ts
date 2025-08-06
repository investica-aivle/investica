import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import {
  MiraeAssetReport,
  MiraeAssetScraperService,
} from "../../providers/reports/MiraeAssetScraperService";
import { PerplexityPdfConverterService } from "../../providers/reports/PerplexityPdfConverterService";

@Controller("reports")
export class ReportsController {
  constructor(
    private readonly miraeAssetScraperService: MiraeAssetScraperService,
    private readonly perplexityPdfConverterService: PerplexityPdfConverterService,
  ) {}

  // ===== 미래에셋증권 전용 API =====

  /**
   * 미래에셋증권에서 특정 키워드의 보고서 스크래핑
   */
  @Post("mirae-asset/scrape")
  async scrapeMiraeAssetReports(
    @Body() body: { keywords: string[] },
  ): Promise<MiraeAssetReport[]> {
    return await this.miraeAssetScraperService.scrapeReportsByKeywords(
      body.keywords,
    );
  }

  /**
   * 미래에셋증권에서 최신 보고서 가져오기
   */
  @Get("mirae-asset/latest")
  async getLatestMiraeAssetReports(
    @Query("keywords") keywords: string,
    @Query("limit") limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    const keywordArray = keywords.split(",").map((k) => k.trim());
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      keywordArray,
      limit,
    );
  }

  /**
   * 미래에셋증권 보고서 PDF 다운로드
   */
  @Post("mirae-asset/download")
  async downloadMiraeAssetReport(
    @Body() body: { downloadUrl: string; outputDir?: string },
  ): Promise<{ filePath: string }> {
    const filePath = await this.miraeAssetScraperService.downloadPdf(
      body.downloadUrl,
      body.outputDir,
    );
    return { filePath };
  }

  /**
   * 미래에셋증권 보고서 일괄 다운로드
   */
  @Post("mirae-asset/download-multiple")
  async downloadMultipleMiraeAssetReports(
    @Body() body: { reports: MiraeAssetReport[]; outputDir?: string },
  ): Promise<{ filePaths: string[] }> {
    const filePaths =
      await this.miraeAssetScraperService.downloadMultipleReports(
        body.reports,
        body.outputDir,
      );
    return { filePaths };
  }

  /**
   * Earnings Revision 보고서 가져오기
   */
  @Get("mirae-asset/earnings-revision")
  async getEarningsRevisionReports(
    @Query("limit") limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      ["Earnings Revision"],
      limit,
    );
  }

  /**
   * Credit Market Weekly 보고서 가져오기
   */
  @Get("mirae-asset/credit-market-weekly")
  async getCreditMarketWeeklyReports(
    @Query("limit") limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      ["Credit Market Weekly"],
      limit,
    );
  }

  // ===== Perplexity PDF 변환 API =====

  /**
   * PDF 파일을 마크다운으로 변환
   */
  @Post("convert-pdf-to-markdown")
  async convertPdfToMarkdown(
    @Body() body: { pdfFilePath: string; outputDir?: string },
  ): Promise<{
    markdown: string;
    fileName: string;
    success: boolean;
    error?: string;
  }> {
    return await this.perplexityPdfConverterService.convertPdfToMarkdown(
      body.pdfFilePath,
      body.outputDir,
    );
  }

  /**
   * 여러 PDF 파일을 일괄 마크다운으로 변환
   */
  @Post("convert-multiple-pdfs-to-markdown")
  async convertMultiplePdfsToMarkdown(
    @Body() body: { pdfFilePaths: string[]; outputDir?: string },
  ): Promise<
    { markdown: string; fileName: string; success: boolean; error?: string }[]
  > {
    return await this.perplexityPdfConverterService.convertMultiplePdfsToMarkdown(
      body.pdfFilePaths,
      body.outputDir,
    );
  }

  /**
   * 보고서 다운로드 후 자동으로 마크다운 변환
   */
  @Post("mirae-asset/download-and-convert")
  async downloadAndConvertReport(
    @Body() body: { downloadUrl: string; outputDir?: string },
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
        body.downloadUrl,
        body.outputDir,
      );

      // 2. 마크다운으로 변환
      const conversionResult =
        await this.perplexityPdfConverterService.convertPdfToMarkdown(
          pdfFilePath,
          body.outputDir
            ? `${body.outputDir}/markdown`
            : "./downloads/markdown",
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
