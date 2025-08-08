import { Body, Controller, Post } from "@nestjs/common";

import type { MiraeAssetReport } from "../../models/Reports";
import { ReportsService } from "../../providers/reports/ReportsService";

// API 응답 타입들을 export하여 Nestia가 인식할 수 있도록 함
export interface SecuritiesReportListResponse {
  message: string;
  reports: MiraeAssetReport[];
}

export interface SecuritiesReportListRequest {
  keywords?: string[];
  limit?: number;
}

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ===== AI가 사용할 함수형 API =====

  /**
   * 1) 최근 주식상황, 경제상황 요약 (함수형)
   *
   * 유저가 "최근 주식상황 어때?" 또는 "경제상황 어때?"라고 요청할 때 사용
   */
  @Post("get-recent-market-summary")
  async getRecentMarketSummary(
    @Body()
    body: {
      limit?: number;
    },
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
    return await this.reportsService.getRecentMarketSummary({
      limit: body.limit || 5,
    });
  }

  /**
   * 2) 증권보고서 리스트 제공 (함수형)
   *
   * 유저가 "증권보고서가 뭐가 있어?"라고 요청할 때 사용
   */
  @Post("get-securities-report-list")
  async getSecuritiesReportList(
    @Body()
    body: SecuritiesReportListRequest,
  ): Promise<SecuritiesReportListResponse> {
    return await this.reportsService.getSecuritiesReportList({
      keywords: body.keywords || ["증권", "분석", "리포트", "보고서"],
      limit: body.limit || 10,
    });
  }

  /**
   * 3) 특정 증권보고서 내용 보기 (함수형)
   *
   * 유저가 특정 보고서를 선택했을 때 해당 보고서의 마크다운 내용을 제공
   */
  @Post("get-specific-report-content")
  async getSpecificReportContent(@Body() body: { title: string }): Promise<{
    message: string;
    title: string;
    date: string;
    author: string;
    content: string;
    success: boolean;
    error?: string;
  }> {
    return await this.reportsService.getSpecificReportContent({
      title: body.title,
    });
  }

  /**
   * 동기화 강제 실행 (관리자용)
   *
   * 수동으로 동기화를 실행할 때 사용
   */
  @Post("force-sync-reports")
  async forceSyncReports(@Body() body: { keywords?: string[] }): Promise<{
    message: string;
    scrapedCount: number;
    convertedCount: number;
  }> {
    return await this.reportsService.forceSyncReports({
      keywords: body.keywords,
    });
  }
}
