import { KeywordSummaryResult, MiraeAssetReport } from "@models/Reports";
import { Injectable } from "@nestjs/common";
import * as fs from "fs";

import { AiAnalysisProvider } from "./AiAnalysisProvider";
import { MiraeAssetReportProvider } from "./MiraeAssetReportProvider";
import { ReportConverter } from "./ReportConverter";
import { ReportFileManager } from "./ReportFileManager";
import { ReportKeywordExtractor } from "./ReportKeywordExtractor";
import { ReportSummarizer } from "./ReportSummarizer";

@Injectable()
export class ReportsService {
  constructor(
    private readonly miraeAssetReportProvider: MiraeAssetReportProvider,
    private readonly aiAnalysisProvider: AiAnalysisProvider,
    private readonly reportConverter: ReportConverter,
    private readonly reportSummarizer: ReportSummarizer,
    private readonly fileManager: ReportFileManager,
    private readonly reportKeywordExtractor: ReportKeywordExtractor,
  ) {}

  public async updateAiReports() {
    const limit = 8;
    const filePath = "./downloads/summary/industry_evaluation.json";
    const now = new Date();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const evaluationData = JSON.parse(fileContent);
        
        if (evaluationData.lastEvaluated) {
          const lastEvaluatedDate = new Date(evaluationData.lastEvaluated);
          const timeDifference = now.getTime() - lastEvaluatedDate.getTime();

          if (timeDifference < twentyFourHoursInMs) {
            const message = `AI 리포트가 마지막 업데이트 후 24시간이 지나지 않아 건너뜁니다. 마지막 업데이트: ${lastEvaluatedDate.toLocaleString()}`;
            console.log(message);
            return;
          }
        }
      } catch (error) {
        console.error("기존 AI 리포트 파일을 읽는 중 오류 발생:", error);
      }
    }

    console.log(`📊 AI 리포트를 새로 생성하거나 업데이트합니다 (보고서 ${limit}개 기준)...`);
    await this.aiAnalysisProvider.evaluateLatestIndustries(limit);
    const message = "AI 리포트가 성공적으로 업데이트되었습니다.";
    console.log(message);
    return;
  }

  public async getKeywords(): Promise<KeywordSummaryResult> {
    return this.reportKeywordExtractor.generateKeywordSummary();
  }

  public getLatestMarkdownFiles(): {
    limitedFiles: MiraeAssetReport[];
    fileContents: { fileName: string; content: string }[];
  } {

    return this.fileManager.getLatestMarkdownFiles();
  }

  /**
   * AI가 분석한 산업군 평가를 가져옵니다.
   * 평가는 '중립적'을 제외하고 '신뢰도 0.6 이상'인 결과만 필터링됩니다.
   */
  public async getIndustryEvaluation(): Promise<any> {
    const filePath = "./downloads/summary/industry_evaluation.json";

    // AI 리포트 업데이트 확인 및 실행 (파일이 없으면 10개 기준으로 생성)
    await this.updateAiReports();

    // 파일이 여전히 존재하지 않는 경우 (업데이트 후에도 생성 실패)
    if (!fs.existsSync(filePath)) {
      throw new Error("AI 리포트 파일을 찾을 수 없거나 생성에 실패했습니다.");
    }

    // 2. 파일 읽기 및 파싱
    const fileContent = fs.readFileSync(filePath, "utf8");
    const evaluationData = JSON.parse(fileContent);

    // 3. 고정 필터 적용
    const filteredEvaluations = evaluationData.industryEvaluations
      .filter((e: any) => e.evaluationCode !== 'NEUTRAL')
      .filter((e: any) => e.confidence >= 0.6);
    
    evaluationData.industryEvaluations = filteredEvaluations;

    return evaluationData;
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

      // JSON 파일 업데이트 시간 확인하여 스크래핑 필요 여부 판단
      const shouldScrape = this.miraeAssetReportProvider.shouldScrapeReports(
        isISReports,
        6, // 6시간 임계값
      );

      let scrapeResult: { reports: any[] } = { reports: [] };

      if (shouldScrape) {
        // 1. 최신 보고서 스크래핑 및 데이터 저장
        scrapeResult = await this.miraeAssetReportProvider.scrapeAndSaveData(
          "./downloads",
          true, // 동기화 활성화
          isISReports,
        );
      }

      let convertedCount: number = 0;
      // 2. PDF를 마크다운으로 변환 (URL 기반)
      const jsonFilePath = isISReports
        ? "./downloads/reports.json"
        : "./downloads/reports_IA.json";
      const conversionResults: { success: boolean; error?: string }[] =
        await this.reportConverter.convertReportsFromJson(
          jsonFilePath,
          "./downloads/markdown",
        );

      convertedCount = conversionResults.filter((r) => r.success).length;

      const syncMessage = shouldScrape
        ? `동기화 완료: ${scrapeResult.reports.length}개 스크래핑, ${convertedCount}개 변환`
        : `동기화 완료: 스크래핑 건너뛰기, ${convertedCount}개 변환`;

      return {
        message: syncMessage,
        scrapedCount: shouldScrape ? scrapeResult.reports.length : 0,
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
   */
  public async getRecentMarketSummary(input: {
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
      const result = await this.reportSummarizer.summarizeLatestMarkdownFiles(
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
   */
  public async getSecuritiesISReportList(input: {
    keywords?: string[];
    limit?: number;
  }) {
    return this.getSecuritiesReportList({ ...input, isISReport: true });
  }

  /**
   * 2) 산업 분석 카테고리 증권보고서 리스트 제공 (유저용)
   */
  public async getSecuritiesIAReportList(input: {
    keywords?: string[];
    limit?: number;
  }) {
    return this.getSecuritiesReportList({ ...input, isISReport: false });
  }

  /**
   * 2) 증권보고서 리스트 제공 (유저용)
   */
  public async getSecuritiesReportList(input: {
    keywords?: string[];
    limit?: number;
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
      this.fileManager.getMarkdownFilesFromJson(jsonFilePath);

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
   */
  public async getSpecificISReportContent(input: {
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
   */
  public async getSpecificIAReportContent(input: {
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
   */
  public async getSpecificReportContent(input: {
    title: string;
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
        this.fileManager.getMarkdownFilesFromJson(jsonFilePath);

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
