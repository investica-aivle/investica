import { Body, Controller, Post } from "@nestjs/common";

import { ReportsService } from "../../providers/reports/ReportsService";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ===== AI가 사용할 함수형 API =====

  /**
   * 최근 증권보고서 가져와서 변환하기 (함수형)
   */
  @Post("function/get-recent-reports")
  async getRecentReportsAndConvert(
    @Body() body: { keywords?: string[]; limit?: number; outputDir?: string },
  ): Promise<{
    message: string;
    reports: Array<{
      title: string;
      date: string;
      author: string;
      markdown: string;
      markdownFileName: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    return await this.reportsService.searchAndDownloadReports({
      keywords: body.keywords || ["증권", "주식시장"],
      limit: body.limit || 3,
      outputDir: body.outputDir,
    });
  }

  /**
   * 특정 보고서 다운로드 및 변환 (함수형)
   */
  @Post("function/download-and-convert")
  async downloadAndConvertReport(
    @Body() body: { downloadUrl: string; outputDir?: string },
  ): Promise<{
    message: string;
    markdown: string;
    markdownFileName: string;
    success: boolean;
    error?: string;
  }> {
    return await this.reportsService.downloadAndConvertReport({
      downloadUrl: body.downloadUrl,
      outputDir: body.outputDir,
    });
  }

  /**
   * PDF 파일을 마크다운으로 변환 (함수형)
   */
  @Post("function/convert-pdf")
  async convertPdfToMarkdown(
    @Body() body: { pdfFilePath: string; outputDir?: string },
  ): Promise<{
    message: string;
    markdown: string;
    fileName: string;
    success: boolean;
    error?: string;
  }> {
    return await this.reportsService.convertPdfToMarkdown({
      pdfFilePath: body.pdfFilePath,
      outputDir: body.outputDir,
    });
  }
}
