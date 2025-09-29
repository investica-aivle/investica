import { Controller, Get, Param, Post, Query } from "@nestjs/common";

import type {
  KeywordSummaryResult,
  MiraeAssetReport,
} from "../../models/Reports";
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

@Controller("api/reports")
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  // ===== 요약 관련 API =====

  /**
   * AI가 분석한 산업군 평가 결과를 반환합니다.
   * 평가는 '중립적'을 제외하고 '신뢰도 0.6 이상'인 결과만 필터링됩니다.
   */
  @Get("summary/industry-evaluation")
  async getIndustryEvaluation(): Promise<any> {
    return await this.reportsService.getIndustryEvaluation();
  }

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
    return await this.reportsService.getKeywords();
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
    return this.reportsService.getLatestMarkdownFiles();
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

  // ===== 수동 트리거 API =====

  /**
   * AI 리포트 생성을 수동으로 트리거합니다.
   */
  @Post("update-reports")
  async updateAIReports() {
    await this.reportsService.updateAiReports();
  }


  @Post("pdf-ccc")
  async triggerPdfConversion() {
    console.log("PDF 변환 수동 트리거");
    await this.reportsService.triggerPdfConversion();
  }
}