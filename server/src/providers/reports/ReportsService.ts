import { Injectable } from "@nestjs/common";

import { MiraeAssetReport } from "../../models/Reports";
import { ReportsFunctionProvider } from "./ReportsFunctionProvider";

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
    private readonly reportsFunctionProvider: ReportsFunctionProvider,
  ) {}

  /**
   * 최근 주식시장 정보 가져오기 (유저용)
   *
   * 유저가 "최근 주식시장 정보 알려줘"라고 요청할 때 사용합니다.
   * 보고서를 다운로드하고 MD로 변환한 후 요약해서 유저에게 제공합니다.
   *
   * > 이 메서드는 유저가 주식시장 정보를 원할 때 사용합니다.
   * > 보고서를 자동으로 다운로드하고 요약해서 제공합니다.
   *
   * @param input 검색 조건
   * @returns 요약된 주식시장 정보
   */
  public async getRecentStockMarketInfo(input: {
    /**
     * 가져올 보고서 개수 (기본값: 3)
     * @minimum 1
     * @maximum 5
     * @example 3
     */
    limit?: number;

    /**
     * 출력 디렉토리 (기본값: "./downloads")
     * @example "./reports"
     */
    outputDir?: string;
  }): Promise<{
    message: string;
    summary: string;
    reports: Array<{
      title: string;
      date: string;
      author: string;
      markdownContent: string;
      markdownFileName: string;
      summary: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const result =
      await this.reportsFunctionProvider.getRecentReportsAndConvert({
        keywords: ["주식시장", "증권시장", "시장동향", "주식분석"],
        limit: input.limit || 3,
        outputDir: input.outputDir,
      });

    // 각 보고서를 요약
    const reportsWithSummary = await Promise.all(
      result.reports.map(async (report) => {
        if (report.success && report.markdown) {
          // 간단한 요약 생성 (실제로는 AI 요약 서비스 사용)
          const summary = this.generateSummary(report.markdown);
          return {
            ...report,
            markdownContent: report.markdown,
            summary,
          };
        } else {
          return {
            ...report,
            markdownContent: report.markdown,
            summary: "요약을 생성할 수 없습니다.",
          };
        }
      }),
    );

    // 전체 요약 생성
    const overallSummary = this.generateOverallSummary(
      reportsWithSummary.map((r) => ({
        title: r.title,
        summary: r.summary,
        category: "주식시장",
      })),
    );

    return {
      message: `최근 주식시장 정보를 ${result.reports.length}개의 보고서에서 수집했습니다.`,
      summary: overallSummary,
      reports: reportsWithSummary,
    };
  }

  /**
   * 증권보고서 요청 처리 (유저용)
   *
   * 유저가 "증권보고서 달라"라고 요청할 때 사용합니다.
   * 다양한 증권보고서를 다운로드하고 MD로 변환한 후 요약해서 제공합니다.
   *
   * > 이 메서드는 유저가 증권보고서를 원할 때 사용합니다.
   * > 여러 종류의 보고서를 자동으로 다운로드하고 요약해서 제공합니다.
   *
   * @param input 검색 조건
   * @returns 요약된 증권보고서들
   */
  public async getSecuritiesReports(input: {
    /**
     * 가져올 보고서 개수 (기본값: 5)
     * @minimum 1
     * @maximum 10
     * @example 5
     */
    limit?: number;

    /**
     * 출력 디렉토리 (기본값: "./downloads")
     * @example "./reports"
     */
    outputDir?: string;
  }): Promise<{
    message: string;
    summary: string;
    reports: Array<{
      title: string;
      date: string;
      author: string;
      markdownContent: string;
      markdownFileName: string;
      summary: string;
      category: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const result =
      await this.reportsFunctionProvider.getRecentReportsAndConvert({
        keywords: ["증권", "분석", "리포트", "보고서"],
        limit: input.limit || 5,
        outputDir: input.outputDir,
      });

    // 각 보고서를 요약하고 카테고리 분류
    const reportsWithSummary = await Promise.all(
      result.reports.map(async (report) => {
        if (report.success && report.markdown) {
          const summary = this.generateSummary(report.markdown);
          const category = this.categorizeReport(report.title);
          return {
            ...report,
            markdownContent: report.markdown,
            summary,
            category,
          };
        } else {
          return {
            ...report,
            markdownContent: report.markdown,
            summary: "요약을 생성할 수 없습니다.",
            category: "기타",
          };
        }
      }),
    );

    // 전체 요약 생성
    const overallSummary = this.generateOverallSummary(
      reportsWithSummary.map((r) => ({
        title: r.title,
        summary: r.summary,
        category: r.category,
      })),
    );

    return {
      message: `증권보고서 ${result.reports.length}개를 수집했습니다.`,
      summary: overallSummary,
      reports: reportsWithSummary,
    };
  }

  /**
   * 보고서 내용 요약 생성 (내부용)
   */
  private generateSummary(markdownContent: string): string {
    // 간단한 요약 로직 (실제로는 AI 요약 서비스 사용)
    const lines = markdownContent.split("\n").filter((line) => line.trim());
    const keyPoints = lines
      .filter(
        (line) =>
          line.startsWith("#") ||
          line.startsWith("**") ||
          line.includes("중요"),
      )
      .slice(0, 5);

    if (keyPoints.length > 0) {
      return keyPoints.join("\n");
    } else {
      // 첫 3줄을 요약으로 사용
      return lines.slice(0, 3).join("\n");
    }
  }

  /**
   * 전체 보고서 요약 생성 (내부용)
   */
  private generateOverallSummary(
    reports: Array<{ title: string; summary: string; category: string }>,
  ): string {
    const categories = [...new Set(reports.map((r) => r.category))];
    const summary = `총 ${reports.length}개의 보고서를 수집했습니다.\n\n`;

    const categorySummary = categories
      .map((category) => {
        const categoryReports = reports.filter((r) => r.category === category);
        return `${category}: ${categoryReports.length}개`;
      })
      .join(", ");

    return summary + categorySummary;
  }

  /**
   * 보고서 카테고리 분류 (내부용)
   */
  private categorizeReport(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("earnings") || lowerTitle.includes("실적")) {
      return "실적분석";
    } else if (lowerTitle.includes("market") || lowerTitle.includes("시장")) {
      return "시장분석";
    } else if (lowerTitle.includes("credit") || lowerTitle.includes("신용")) {
      return "신용분석";
    } else if (lowerTitle.includes("주식") || lowerTitle.includes("stock")) {
      return "주식분석";
    } else {
      return "기타";
    }
  }

  /**
   * 최근 증권보고서 검색 및 다운로드
   *
   * 미래에셋증권에서 특정 키워드의 최근 보고서를 찾아서
   * 다운로드하고 마크다운으로 변환합니다.
   *
   * > 키워드는 "증권", "주식", "시장동향", "분석" 등으로 검색 가능합니다.
   * > 최신 보고서부터 순서대로 처리됩니다.
   *
   * @param input 검색 조건
   * @returns 처리된 보고서 정보
   */
  public async searchAndDownloadReports(input: {
    /**
     * 검색할 키워드들
     * @example ["증권", "주식시장"]
     * @example ["Earnings Revision"]
     * @example ["Credit Market Weekly"]
     */
    keywords: string[];

    /**
     * 가져올 보고서 개수 (기본값: 3)
     * @minimum 1
     * @maximum 10
     * @example 5
     */
    limit?: number;

    /**
     * 출력 디렉토리 (기본값: "./downloads")
     * @example "./reports"
     */
    outputDir?: string;
  }): Promise<{
    message: string;
    reports: Array<{
      title: string;
      date: string;
      author: string;
      pdfFilePath: string;
      markdown: string;
      markdownFileName: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const result =
      await this.reportsFunctionProvider.getRecentReportsAndConvert({
        keywords: input.keywords,
        limit: input.limit,
        outputDir: input.outputDir,
      });

    // ReportsFunctionProvider의 결과를 ReportsService 형식으로 변환
    const reports = result.reports.map((report) => ({
      title: report.title,
      date: report.date,
      author: report.author,
      pdfFilePath: "", // ReportsFunctionProvider에서는 pdfFilePath를 반환하지 않음
      markdown: report.markdown,
      markdownFileName: report.markdownFileName,
      success: report.success,
      error: report.error,
    }));

    return {
      message: result.message,
      reports,
    };
  }

  /**
   * 특정 보고서 다운로드 및 변환
   *
   * 특정 보고서의 다운로드 URL을 받아서 PDF를 다운로드하고
   * 마크다운으로 변환합니다.
   *
   * @param input 다운로드 정보
   * @returns 변환된 보고서 정보
   */
  public async downloadAndConvertReport(input: {
    /**
     * 보고서 다운로드 URL
     * @example "https://securities.miraeasset.com/download/..."
     */
    downloadUrl: string;

    /**
     * 출력 디렉토리 (기본값: "./downloads")
     * @example "./reports"
     */
    outputDir?: string;
  }): Promise<{
    message: string;
    pdfFilePath: string;
    markdown: string;
    markdownFileName: string;
    success: boolean;
    error?: string;
  }> {
    const result = await this.reportsFunctionProvider.downloadAndConvertReport({
      downloadUrl: input.downloadUrl,
      outputDir: input.outputDir,
    });

    return {
      message: result.message,
      pdfFilePath: result.markdownFileName, // ReportsFunctionProvider에서는 markdownFileName을 pdfFilePath로 사용
      markdown: result.markdown,
      markdownFileName: result.markdownFileName,
      success: result.success,
      error: result.error,
    };
  }

  /**
   * 최근 증권시장 동향 보고서 가져오기
   *
   * 미래에셋증권의 최신 시장 동향 보고서들을 가져옵니다.
   *
   * @param input 검색 조건
   * @returns 시장 동향 보고서들
   */
  public async getMarketTrendReports(input: {
    /**
     * 가져올 보고서 개수 (기본값: 5)
     * @minimum 1
     * @maximum 20
     * @example 10
     */
    limit?: number;
  }): Promise<{
    message: string;
    reports: MiraeAssetReport[];
  }> {
    const result =
      await this.reportsFunctionProvider.getRecentReportsAndConvert({
        keywords: ["시장동향", "시장분석", "주식시장", "증권시장"],
        limit: input.limit || 5,
      });

    // ReportsFunctionProvider의 결과를 MiraeAssetReport 형식으로 변환
    const reports: MiraeAssetReport[] = result.reports.map((report) => ({
      title: report.title,
      date: report.date,
      author: report.author,
      downloadUrl: "", // ReportsFunctionProvider에서는 downloadUrl을 반환하지 않음
      fileName: report.markdownFileName,
      category: "Market Trend",
    }));

    return {
      message: result.message,
      reports,
    };
  }

  /**
   * Earnings Revision 보고서 가져오기
   *
   * 미래에셋증권의 최신 Earnings Revision 보고서들을 가져옵니다.
   *
   * @param input 검색 조건
   * @returns Earnings Revision 보고서들
   */
  public async getEarningsRevisionReports(input: {
    /**
     * 가져올 보고서 개수 (기본값: 5)
     * @minimum 1
     * @maximum 20
     * @example 10
     */
    limit?: number;
  }): Promise<{
    message: string;
    reports: MiraeAssetReport[];
  }> {
    const result =
      await this.reportsFunctionProvider.getEarningsRevisionReports({
        limit: input.limit || 5,
      });

    // ReportsFunctionProvider의 결과를 MiraeAssetReport 형식으로 변환
    const reports: MiraeAssetReport[] = result.reports.map((report) => ({
      title: report.title,
      date: report.date,
      author: report.author,
      downloadUrl: "", // ReportsFunctionProvider에서는 downloadUrl을 반환하지 않음
      fileName: report.markdownFileName,
      category: "Earnings Revision",
    }));

    return {
      message: result.message,
      reports,
    };
  }

  /**
   * PDF 파일을 마크다운으로 변환
   *
   * 기존 PDF 파일을 마크다운으로 변환합니다.
   *
   * @param input 변환 정보
   * @returns 변환 결과
   */
  public async convertPdfToMarkdown(input: {
    /**
     * PDF 파일 경로
     * @example "./downloads/report.pdf"
     */
    pdfFilePath: string;

    /**
     * 출력 디렉토리 (기본값: "./downloads/markdown")
     * @example "./reports/markdown"
     */
    outputDir?: string;
  }): Promise<{
    message: string;
    markdown: string;
    fileName: string;
    success: boolean;
    error?: string;
  }> {
    const result = await this.reportsFunctionProvider.convertPdfToMarkdown({
      pdfFilePath: input.pdfFilePath,
      outputDir: input.outputDir,
    });

    return {
      message: result.message,
      markdown: result.markdown,
      fileName: result.fileName,
      success: result.success,
      error: result.error,
    };
  }
}
