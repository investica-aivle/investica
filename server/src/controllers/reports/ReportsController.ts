import { Controller, Get, Param, Query } from "@nestjs/common";

import type {
  KeywordSummaryResult,
  MiraeAssetReport,
} from "../../models/Reports";
import { ReportAiProvider } from "../../providers/reports/ReportAiProvider";
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
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportAiProvider: ReportAiProvider,
  ) {}

  // ===== 요약 관련 API =====

  /**
   * 최근 주식상황, 경제상황 요약
   */
  @Get("summary")
  async getRecentMarketSummary(@Query("limit") limit?: number): Promise<{
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
      limit: limit || 5,
    });
  }

  /**
   * 키워드 기반 짧은 요약
   */
  @Get("summary/keyword")
  async getKeywordSummary(
    @Query("limit") limit?: number,
  ): Promise<KeywordSummaryResult> {
    return await this.reportAiProvider.generateKeywordSummary(
      "./downloads/reports.json",
      limit || 5,
    );
  }

  /**
   * 최신 마크다운 파일들 가져오기
   */
  @Get("latest")
  async getLatestMarkdownFiles(
    @Query("limit") limit: number,
    @Query("contentLengthLimit") contentLengthLimit?: number,
    @Query("shouldLimitLength") shouldLimitLength?: boolean,
  ): Promise<{
    limitedFiles: any[];
    fileContents: any[];
  }> {
    const options = {
      contentLengthLimit: contentLengthLimit
        ? parseInt(contentLengthLimit.toString())
        : 2000,
      shouldLimitLength:
        shouldLimitLength !== undefined ? shouldLimitLength : true,
    };

    return await this.reportAiProvider.getLatestMarkdownFiles(
      "./downloads/reports.json",
      limit || 20,
      options,
    );
  }

  // ===== 투자 전략 리포트 관련 API =====

  /**
   * 투자 전략 증권보고서 리스트 제공
   */
  @Get("investment-strategy")
  async getSecuritiesISReportList(
    @Query("keywords") keywords?: string,
    @Query("limit") limit?: number,
  ): Promise<SecuritiesReportListResponse> {
    const keywordArray = keywords ? keywords.split(",") : undefined;
    return await this.reportsService.getSecuritiesISReportList({
      keywords: keywordArray,
      limit: limit || 10,
    });
  }

  /**
   * 특정 투자 전략 증권보고서 내용 보기
   */
  @Get("investment-strategy/:title")
  async getSpecificISReportContent(@Param("title") title: string): Promise<{
    message: string;
    title: string;
    date: string;
    author: string;
    content: string;
    success: boolean;
    error?: string;
  }> {
    return await this.reportsService.getSpecificISReportContent({
      title: decodeURIComponent(title),
    });
  }

  // ===== 산업 분석 리포트 관련 API =====

  /**
   * 산업 분석 증권보고서 리스트 제공
   */
  @Get("industry-analysis")
  async getSecuritiesIAReportList(
    @Query("keywords") keywords?: string,
    @Query("limit") limit?: number,
  ): Promise<SecuritiesReportListResponse> {
    const keywordArray = keywords ? keywords.split(",") : undefined;
    return await this.reportsService.getSecuritiesIAReportList({
      keywords: keywordArray,
      limit: limit || 10,
    });
  }

  /**
   * 특정 산업 분석 증권보고서 내용 보기
   */
  @Get("industry-analysis/:title")
  async getSpecificIAReportContent(@Param("title") title: string): Promise<{
    message: string;
    title: string;
    date: string;
    author: string;
    content: string;
    success: boolean;
    error?: string;
  }> {
    return await this.reportsService.getSpecificIAReportContent({
      title: decodeURIComponent(title),
    });
  }

  // ===== 범용 API (기본값: 투자 전략) =====

  /**
   * 증권보고서 리스트 제공 (기본값: 투자 전략)
   */
  @Get()
  async getSecuritiesReportList(
    @Query("keywords") keywords?: string,
    @Query("limit") limit?: number,
  ): Promise<SecuritiesReportListResponse> {
    const keywordArray = keywords ? keywords.split(",") : undefined;
    return await this.reportsService.getSecuritiesReportList({
      keywords: keywordArray,
      limit: limit || 10,
      isISReport: true, // 기본값: 투자 전략
    });
  }

  /**
   * 특정 증권보고서 내용 보기 (기본값: 투자 전략)
   */
  @Get(":title")
  async getSpecificReportContent(@Param("title") title: string): Promise<{
    message: string;
    title: string;
    date: string;
    author: string;
    content: string;
    success: boolean;
    error?: string;
  }> {
    return await this.reportsService.getSpecificReportContent({
      title: decodeURIComponent(title),
      isISReport: true, // 기본값: 투자 전략
    });
  }
}
