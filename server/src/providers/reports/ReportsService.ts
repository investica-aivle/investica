import { Injectable } from "@nestjs/common";

import { MiraeAssetReport } from "../../models/Reports";
import { MiraeAssetReportProvider } from "./MiraeAssetReportProvider";
import { PerplexityProvider } from "./PerplexityProvider";

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
    private readonly perplexityProvider: PerplexityProvider,
  ) {}

  /**
   * 모든 요청 전에 실행되는 동기화 메서드
   * 최신 보고서를 다운로드하고 마크다운으로 변환합니다.
   */
  private async syncReports(): Promise<void> {
    try {
      console.log("🔄 동기화 시작: 최신 보고서 다운로드 및 변환");

      // 1. 최신 보고서 다운로드
      const scrapeResult =
        await this.miraeAssetReportProvider.scrapeAndDownloadReports(
          [
            "주식시장",
            "증권시장",
            "시장동향",
            "주식분석",
            "증권",
            "분석",
            "리포트",
            "보고서",
          ],
          "./downloads",
          true, // 동기화 활성화
        );

      if (scrapeResult.reports.length > 0) {
        console.log(
          `📥 ${scrapeResult.reports.length}개의 새로운 보고서 다운로드 완료`,
        );

        // 2. PDF를 마크다운으로 변환
        const conversionResults =
          await this.perplexityProvider.convertDownloadedPdfToMarkdown(
            "./downloads",
            "./downloads/markdown",
          );

        const successCount = conversionResults.filter((r) => r.success).length;
        console.log(
          `📝 ${conversionResults.length}개 중 ${successCount}개 마크다운 변환 완료`,
        );
      } else {
        console.log("✅ 이미 최신 상태입니다.");
      }
    } catch (error) {
      console.error("❌ 동기화 중 오류:", error);
    }
  }

  /**
   * 1) 최근 주식상황, 경제상황 요약 (유저용)
   *
   * 유저가 "최근 주식상황 어때?" 또는 "경제상황 어때?"라고 요청할 때 사용합니다.
   * 최신 5개의 보고서를 요약해서 제공합니다.
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
    // 동기화 먼저 실행
    await this.syncReports();

    // 최신 마크다운 파일들 요약
    const result = await this.perplexityProvider.summarizeLatestMarkdownFiles(
      "./downloads/markdown",
      input.limit || 5,
    );

    return {
      message: result.message,
      summary: result.summary,
      referencedFiles: result.referencedFiles,
    };
  }

  /**
   * 2) 증권보고서 리스트 제공 (유저용)
   *
   * 유저가 "증권보고서가 뭐가 있어?"라고 요청할 때 사용합니다.
   * 최신 증권보고서들의 목록을 제공합니다.
   *
   * @param input 검색 조건
   * @returns 증권보고서 리스트
   */
  public async getSecuritiesReportList(input: {
    /**
     * 검색할 키워드들 (기본값: ["증권", "분석", "리포트", "보고서"])
     * @example ["증권", "주식시장"]
     */
    keywords?: string[];

    /**
     * 가져올 보고서 개수 (기본값: 10)
     * @minimum 1
     * @maximum 50
     * @example 10
     */
    limit?: number;
  }): Promise<{
    message: string;
    reports: Array<{
      title: string;
      date: string;
      author: string;
      downloadUrl: string;
      hasMarkdown: boolean;
      markdownFileName?: string;
    }>;
  }> {
    // 동기화 먼저 실행
    await this.syncReports();

    // 보고서 스크래핑
    const scrapeResult =
      await this.miraeAssetReportProvider.scrapeAndDownloadReports(
        input.keywords || ["증권", "분석", "리포트", "보고서"],
        "./downloads",
        true,
      );

    // 마크다운 파일 존재 여부 확인
    const reportsWithMarkdown = scrapeResult.reports.map((report) => {
      const fileName = this.extractFileNameFromReport(report);
      const markdownFileName = `${fileName}.md`;
      const markdownPath = `./downloads/markdown/${markdownFileName}`;
      const hasMarkdown = require("fs").existsSync(markdownPath);

      return {
        title: report.title,
        date: report.date,
        author: report.author,
        downloadUrl: report.downloadUrl,
        hasMarkdown,
        markdownFileName: hasMarkdown ? markdownFileName : undefined,
      };
    });

    // limit 적용
    const limitedReports = reportsWithMarkdown.slice(0, input.limit || 10);

    return {
      message: `증권보고서 ${limitedReports.length}개를 찾았습니다.`,
      reports: limitedReports,
    };
  }

  /**
   * 3) 특정 증권보고서 내용 보기 (유저용)
   *
   * 유저가 특정 보고서를 선택했을 때 해당 보고서의 마크다운 내용을 제공합니다.
   *
   * @param input 보고서 정보
   * @returns 보고서 내용
   */
  public async getSpecificReportContent(input: {
    /**
     * 보고서 제목 (정확히 일치해야 함)
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
    // 동기화 먼저 실행
    await this.syncReports();

    try {
      // 1. 보고서 찾기
      const scrapeResult =
        await this.miraeAssetReportProvider.scrapeAndDownloadReports(
          [], // 모든 보고서 검색
          "./downloads",
          true,
        );

      const targetReport = scrapeResult.reports.find(
        (report) => report.title === input.title,
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

      // 2. 마크다운 파일 확인
      const fileName = this.extractFileNameFromReport(targetReport);
      const markdownFileName = `${fileName}.md`;
      const markdownPath = `./downloads/markdown/${markdownFileName}`;

      if (!require("fs").existsSync(markdownPath)) {
        // 마크다운 파일이 없으면 변환 시도
        console.log(
          `마크다운 파일이 없어서 변환을 시도합니다: ${markdownFileName}`,
        );

        const pdfPath = `./downloads/${fileName}.pdf`;
        if (require("fs").existsSync(pdfPath)) {
          const conversionResult =
            await this.perplexityProvider.convertDownloadedPdfToMarkdown(
              "./downloads",
              "./downloads/markdown",
            );

          const targetConversion = conversionResult.find(
            (r) => r.fileName === markdownFileName,
          );
          if (targetConversion && targetConversion.success) {
            return {
              message: `"${input.title}" 보고서 내용을 성공적으로 가져왔습니다.`,
              title: targetReport.title,
              date: targetReport.date,
              author: targetReport.author,
              content: targetConversion.markdown,
              success: true,
            };
          }
        }
      } else {
        // 마크다운 파일이 있으면 읽기
        const content = require("fs").readFileSync(markdownPath, "utf8");
        return {
          message: `"${input.title}" 보고서 내용을 성공적으로 가져왔습니다.`,
          title: targetReport.title,
          date: targetReport.date,
          author: targetReport.author,
          content,
          success: true,
        };
      }

      return {
        message: `"${input.title}" 보고서의 마크다운 파일을 찾을 수 없습니다.`,
        title: targetReport.title,
        date: targetReport.date,
        author: targetReport.author,
        content: "",
        success: false,
        error: "마크다운 파일을 찾을 수 없습니다.",
      };
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

  /**
   * 동기화 강제 실행 (관리자용)
   *
   * 수동으로 동기화를 실행할 때 사용합니다.
   *
   * @param input 동기화 조건
   * @returns 동기화 결과
   */
  public async forceSyncReports(input: {
    /**
     * 검색할 키워드들 (기본값: ["주식시장", "증권시장", "시장동향", "주식분석", "증권", "분석", "리포트", "보고서"])
     * @example ["증권", "주식시장"]
     */
    keywords?: string[];
  }): Promise<{
    message: string;
    downloadedCount: number;
    convertedCount: number;
  }> {
    try {
      console.log("🔄 강제 동기화 시작");

      // 1. 최신 보고서 다운로드
      const scrapeResult =
        await this.miraeAssetReportProvider.scrapeAndDownloadReports(
          input.keywords || [
            "주식시장",
            "증권시장",
            "시장동향",
            "주식분석",
            "증권",
            "분석",
            "리포트",
            "보고서",
          ],
          "./downloads",
          true, // 동기화 활성화
        );

      let convertedCount = 0;
      if (scrapeResult.reports.length > 0) {
        // 2. PDF를 마크다운으로 변환
        const conversionResults =
          await this.perplexityProvider.convertDownloadedPdfToMarkdown(
            "./downloads",
            "./downloads/markdown",
          );

        convertedCount = conversionResults.filter((r) => r.success).length;
      }

      return {
        message: `동기화 완료: ${scrapeResult.reports.length}개 다운로드, ${convertedCount}개 변환`,
        downloadedCount: scrapeResult.reports.length,
        convertedCount,
      };
    } catch (error) {
      throw new Error(
        `동기화 중 오류: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 보고서에서 파일명 추출 (내부용)
   */
  private extractFileNameFromReport(report: MiraeAssetReport): string {
    // attachmentId 추출
    const urlParams = new URLSearchParams(
      report.downloadUrl.split("?")[1] || "",
    );
    const attachmentId = urlParams.get("attachmentId") || "unknown";

    // 날짜를 yyyymmdd 형식으로 변환
    const dateObj = new Date(report.date);
    const formattedDate =
      dateObj.getFullYear().toString() +
      (dateObj.getMonth() + 1).toString().padStart(2, "0") +
      dateObj.getDate().toString().padStart(2, "0");

    // 제목에서 특수문자 제거 및 공백을 언더스코어로 변경
    const cleanTitle = report.title
      .replace(/[^\w\s가-힣]/g, "") // 특수문자 제거
      .replace(/\s+/g, "_") // 공백을 언더스코어로 변경
      .substring(0, 50); // 길이 제한

    return `${formattedDate}_${cleanTitle}_${attachmentId}`;
  }
}
