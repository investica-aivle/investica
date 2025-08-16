import { MiraeAssetReport } from "@models/Reports";
import { Injectable } from "@nestjs/common";

import { MiraeAssetReportProvider } from "./MiraeAssetReportProvider";
import { ReportAiProvider } from "./ReportAiProvider";

/**
 * Reports Service for Agentica Class Protocol
 *
 * This service provides comprehensive report functionality for Agentica AI agents
 * using the Class protocol. It combines Mirae Asset scraping and PDF conversion
 * to provide a complete solution for accessing and processing financial reports.
 *
 * > If you're an A.I. chatbot and the user wants to access Korean financial reports,
 * > you should use the methods in this service to find, download, and convert reports.
 * > Each method contains detailed information about required parameters and return values.
 */

@Injectable()
export class ReportsService {
  constructor(
    private readonly miraeAssetReportProvider: MiraeAssetReportProvider,
    private readonly reportAiProvider: ReportAiProvider,
  ) {}

  /**
   * 모든 투자 전략 리포트 요청 전에 실행되는 동기화 메서드
   * 최신 보고서를 다운로드하고 마크다운으로 변환합니다.
   */
  private async syncISReports(): Promise<{
    message: string;
    scrapedCount: number;
    convertedCount: number;
  }> {
    return this.syncReports();
  }

  /**
   * 모든 산업 분석 리포트 요청 전에 실행되는 동기화 메서드
   * 최신 보고서를 다운로드하고 마크다운으로 변환합니다.
   */
  private async syncIAReports(): Promise<{
    message: string;
    scrapedCount: number;
    convertedCount: number;
  }> {
    return this.syncReports(false);
  }

  /**
   * 모든 요청 전에 실행되는 동기화 메서드
   * 최신 보고서를 다운로드하고 마크다운으로 변환합니다.
   */
  private async syncReports(isISReports: boolean = true): Promise<{
    message: string;
    scrapedCount: number;
    convertedCount: number;
  }> {
    try {
      console.log("🔄 보고서 동기화 시작");

      // 1. 최신 보고서 스크래핑 및 데이터 저장
      const scrapeResult =
        await this.miraeAssetReportProvider.scrapeAndSaveData(
          "./downloads",
          true, // 동기화 활성화
          isISReports,
        );

      let convertedCount: number = 0;
      // 2. PDF를 마크다운으로 변환 (URL 기반)
      const conversionResults: { success: boolean; error?: string }[] =
        await this.reportAiProvider.convertReportsFromJson(
          "./downloads/reports.json",
          "./downloads/markdown",
        );

      convertedCount = conversionResults.filter((r) => r.success).length;

      return {
        message: `동기화 완료: ${scrapeResult.reports.length}개 스크래핑, ${convertedCount}개 변환`,
        scrapedCount: scrapeResult.reports.length,
        convertedCount,
      };
    } catch (error) {
      throw new Error(
        `동기화 중 오류: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 1) 최근 주식상황, 경제상황 요약 (유저용)
   *
   * 유저가 "최근 주식상황 어때?" 또는 "경제상황 어때?"라고 요청할 때 사용합니다.
   * 최신 5개의 투자 전략 보고서를 요약해서 제공합니다.
   *
   * @param input 요약 조건
   * @returns 요약된 주식/경제 상황
   */
  public async getRecentMarketSummary(input: {
    /**
     * 요약할 최신 파일 개수 (기본값: 5)
     * @minimum 1
     * @maximum 10
     * @example 5
     */
    limit?: number;
  }): Promise<{
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
      // 동기화 먼저 실행
      await this.syncReports();

      // 최신 마크다운 파일들 요약
      const result = await this.reportAiProvider.summarizeLatestMarkdownFiles(
        "./downloads/reports.json",
        input.limit || 5,
      );

      return {
        message: result.message,
        summary: result.summary,
        referencedFiles: result.referencedFiles,
      };
    } catch (error) {
      throw new Error(
        `최근 주식상황 요약 중 오류: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 2) 투자 전략 카테고리 증권보고서 리스트 제공 (유저용)
   *
   * 유저가 "증권보고서가 뭐가 있어?"라고 요청할 때 사용합니다.
   * 혹은 보고서 머가있어? 라고 요청할 때 사용합니다.
   * 최신 투자 전략 카테고리의 증권보고서들의 목록을 제공합니다.
   *
   * @param input 검색 조건
   * @returns 증권보고서 리스트
   */
  public async getSecuritiesISReportList(input: {
    keywords?: string[];
    limit?: number;
  }) {
    return this.getSecuritiesReportList({ ...input, isISReport: true });
  }

  /**
   * 2) 산업 분석 카테고리 증권보고서 리스트 제공 (유저용)
   *
   * 유저가 "요즘 살펴볼만한 분야 뭐가 있어?"라고 요청할 때 사용합니다.
   * 최신 산업 분석 카테고리의 증권보고서들의 목록을 제공합니다.
   *
   * @param input 검색 조건
   * @returns 증권보고서 리스트
   */
  public async getSecuritiesIAReportList(input: {
    keywords?: string[];
    limit?: number;
  }) {
    return this.getSecuritiesReportList({ ...input, isISReport: false });
  }

  /**
   * 2) 증권보고서 리스트 제공 (유저용)
   *
   * 유저가 "증권보고서가 뭐가 있어?"라고 요청할 때 사용합니다.
   * 혹은 보고서 머가있어? 라고 요청할 때 사용합니다.
   * 최신 투자 전략 카테고리의 증권보고서들의 목록을 제공합니다.
   *
   * @param input 검색 조건
   * @param isISReport true: 투자 전략 보고서, false: 산업 분석 보고서
   * @returns 증권보고서 리스트
   */
  public async getSecuritiesReportList(input: {
    /**
     * 검색할 키워드들 (선택사항)
     * @example []
     */
    keywords?: string[];

    /**
     * 가져올 보고서 개수 (기본값: 10)
     * @minimum 1
     * @maximum 50
     * @example 10
     */
    limit?: number;

    /**
     * 보고서 타입 (기본값: true - 투자 전략 보고서)
     * @example true
     */
    isISReport?: boolean;
  }): Promise<{
    message: string;
    reports: Array<MiraeAssetReport>;
  }> {
    // 동기화 먼저 실행
    await this.syncReports(input.isISReport ?? true);

    // JSON 파일에서 보고서 정보 읽기
    const jsonFilePath =
      (input.isISReport ?? true)
        ? "./downloads/reports.json"
        : "./downloads/reports_IA.json";
    if (!require("fs").existsSync(jsonFilePath)) {
      return {
        message: "보고서 정보를 찾을 수 없습니다.",
        reports: [],
      };
    }

    // JSON에서 마크다운 파일들 가져오기
    const markdownFiles: MiraeAssetReport[] =
      this.reportAiProvider.getMarkdownFilesFromJson(jsonFilePath);

    // limit 적용
    const limitedReports: MiraeAssetReport[] = markdownFiles.slice(
      0,
      input.limit || 10,
    );

    return {
      message: `증권보고서 ${limitedReports.length}개를 찾았습니다.`,
      reports: limitedReports,
    };
  }

  /**
   * 3) 특정 투자 전략 증권보고서 내용 보기 (유저용)
   *
   * 유저가 특정 투자 전략 보고서를 선택했을 때 해당 보고서의 마크다운 내용을 제공합니다.
   *
   * @param input 보고서 정보
   * @returns 보고서 내용
   */
  public async getSpecificISReportContent(input: {
    /**
     * 보고서 제목
     * @example "주식시장 동향 분석"
     */
    title: string;
  }): Promise<{
    message: string;
    title: string;
    date: string;
    author: string;
    content: string;
    success: boolean;
    error?: string;
  }> {
    return this.getSpecificReportContent(input);
  }

  /**
   * 3) 특정 산업 분석 증권보고서 내용 보기 (유저용)
   *
   * 유저가 특정 산업 분석 보고서를 선택했을 때 해당 보고서의 마크다운 내용을 제공합니다.
   *
   * @param input 보고서 정보
   * @returns 보고서 내용
   */
  public async getSpecificIAReportContent(input: {
    /**
     * 보고서 제목
     * @example "주식시장 동향 분석"
     */
    title: string;
  }): Promise<{
    message: string;
    title: string;
    date: string;
    author: string;
    content: string;
    success: boolean;
    error?: string;
  }> {
    return this.getSpecificReportContent({ ...input, isISReport: false });
  }

  /**
   * 3) 특정 투자 전략 증권보고서 내용 보기 (유저용)
   *
   * 유저가 특정 보고서를 선택했을 때 해당 보고서의 마크다운 내용을 제공합니다.
   *
   * @param input 보고서 정보
   * @param isISReport true: 투자 전략 카테고리 보고서, false: 산업 분석 카테고리 보고서
   * @returns 보고서 내용
   */
  public async getSpecificReportContent(input: {
    /**
     * 보고서 제목
     * @example "주식시장 동향 분석"
     */
    title: string;

    /**
     * 보고서 타입 (기본값: true - 투자 전략 보고서)
     * @example true
     */
    isISReport?: boolean;
  }): Promise<{
    message: string;
    title: string;
    date: string;
    author: string;
    content: string;
    success: boolean;
    error?: string;
  }> {
    // 동기화 먼저 실행
    await this.syncReports();

    try {
      // JSON 파일에서 보고서 정보 읽기
      const jsonFilePath =
        (input.isISReport ?? true)
          ? "./downloads/reports.json"
          : "./downloads/reports_IA.json";
      if (!require("fs").existsSync(jsonFilePath)) {
        return {
          message: "보고서 정보를 찾을 수 없습니다.",
          title: "",
          date: "",
          author: "",
          content: "",
          success: false,
          error: "JSON 파일이 없습니다.",
        };
      }

      // JSON에서 마크다운 파일들 가져오기
      const markdownFiles: MiraeAssetReport[] =
        this.reportAiProvider.getMarkdownFilesFromJson(jsonFilePath);

      // 제목으로 보고서 찾기
      const targetReport: MiraeAssetReport | undefined = markdownFiles.find(
        (report: MiraeAssetReport) => report.title === input.title,
      );

      if (!targetReport) {
        return {
          message: `"${input.title}" 보고서를 찾을 수 없습니다.`,
          title: "",
          date: "",
          author: "",
          content: "",
          success: false,
          error: "보고서를 찾을 수 없습니다.",
        };
      }

      // 마크다운 파일 확인
      if (targetReport.mdFileName) {
        // 마크다운 파일이 있으면 읽기
        const markdownPath = `./downloads/markdown/${targetReport.mdFileName}`;

        if (require("fs").existsSync(markdownPath)) {
          const content: string = require("fs").readFileSync(
            markdownPath,
            "utf8",
          );
          return {
            message: `"${input.title}" 보고서 내용을 성공적으로 가져왔습니다.`,
            title: targetReport.title,
            date: targetReport.date,
            author: targetReport.author,
            content,
            success: true,
          };
        }
      }

      throw new Error("마크다운 파일이 없습니다.");
    } catch (error) {
      return {
        message: `"${input.title}" 보고서 처리 중 오류가 발생했습니다.`,
        title: "",
        date: "",
        author: "",
        content: "",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
