import { Controller } from "@nestjs/common";

import {
  MiraeAssetReport,
  MiraeAssetScraperService,
} from "../../providers/reports/MiraeAssetScraperService";

@Controller("reports-agent")
export class ReportsAgentController {
  constructor(
    private readonly miraeAssetScraperService: MiraeAssetScraperService,
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
}
