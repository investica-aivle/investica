import { Controller } from "@nestjs/common";

import { MiraeAssetReport } from "../../models/Reports";
import { ReportsFunctionProvider } from "../../providers/reports/ReportsFunctionProvider";

@Controller("reports-agent")
export class ReportsAgentController {
  constructor(
    private readonly reportsFunctionProvider: ReportsFunctionProvider,
  ) {}

  /**
   * 최근 증권사 보고서 가져오기
   */
  async getLatestReports(
    keywords: string[] = ["Earnings Revision", "Credit Market Weekly"],
    limit: number = 5,
  ): Promise<{ message: string; reports: MiraeAssetReport[] }> {
    const result =
      await this.reportsFunctionProvider.getRecentReportsAndConvert({
        keywords,
        limit,
      });
    return {
      message: result.message,
      reports: result.reports.map((r: any) => ({
        title: r.title,
        date: r.date,
        author: r.author,
        downloadUrl: "", // ReportsFunctionProvider에서는 downloadUrl을 반환하지 않음
        fileName: r.markdownFileName,
        category: "Other",
      })),
    };
  }

  async getEarningsRevisionReports(
    limit: number = 5,
  ): Promise<{ message: string; reports: MiraeAssetReport[] }> {
    const result =
      await this.reportsFunctionProvider.getEarningsRevisionReports({ limit });
    return {
      message: result.message,
      reports: result.reports.map((r: any) => ({
        title: r.title,
        date: r.date,
        author: r.author,
        downloadUrl: "",
        fileName: r.markdownFileName,
        category: "Earnings Revision",
      })),
    };
  }

  async getCreditMarketWeeklyReports(
    limit: number = 5,
  ): Promise<{ message: string; reports: MiraeAssetReport[] }> {
    const result =
      await this.reportsFunctionProvider.getRecentReportsAndConvert({
        keywords: ["Credit Market Weekly"],
        limit,
      });
    return {
      message: result.message,
      reports: result.reports.map((r: any) => ({
        title: r.title,
        date: r.date,
        author: r.author,
        downloadUrl: "",
        fileName: r.markdownFileName,
        category: "Credit Market Weekly",
      })),
    };
  }

  async downloadReport(
    downloadUrl: string,
    outputDir: string = "./downloads",
  ): Promise<{ filePath: string; success: boolean }> {
    try {
      const result =
        await this.reportsFunctionProvider.downloadAndConvertReport({
          downloadUrl,
          outputDir,
        });
      return { filePath: result.markdownFileName, success: result.success };
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
    const result = await this.reportsFunctionProvider.convertPdfToMarkdown({
      pdfFilePath,
      outputDir,
    });
    return {
      markdown: result.markdown,
      fileName: result.fileName,
      success: result.success,
      error: result.error,
    };
  }

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
    const result = await this.reportsFunctionProvider.downloadAndConvertReport({
      downloadUrl,
      outputDir,
    });
    return {
      pdfFilePath: "", // ReportsFunctionProvider에서는 pdfFilePath를 반환하지 않음
      markdown: result.markdown,
      markdownFileName: result.markdownFileName,
      success: result.success,
      error: result.error,
    };
  }
}
