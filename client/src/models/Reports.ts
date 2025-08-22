/**
 * Reports 관련 클라이언트 타입 정의
 */

/**
 * 미래에셋증권 보고서 정보
 */
export interface MiraeAssetReport {
  id: string; // attachmentId
  title: string;
  date: string;
  author: string;
  downloadUrl: string;
  mdFileName?: string | null;
}

/**
 * 키워드 정보
 */
export interface Keyword {
  icon: string;
  keyword: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
}

/**
 * 키워드 요약 결과
 */
export interface KeywordSummaryResult {
  message: string;
  keywords: Keyword[];
  referencedFiles: MiraeAssetReport[];
}

/**
 * 키워드 캐시 데이터
 */
export interface KeywordCacheData {
  keywords: Keyword[];
  referencedFiles: MiraeAssetReport[];
  updatedAt: string;
}

/**
 * 보고서 상세 정보
 */
export interface ReportDetail {
  message: string;
  title: string;
  date: string;
  author: string;
  content: string;
  success: boolean;
  error?: string;
}

/**
 * 보고서 검색 입력
 */
export interface ReportSearchInput {
  keywords: string[];
  limit?: number;
}

/**
 * 보고서 다운로드 결과
 */
export interface ReportDownloadResult {
  reports: MiraeAssetReport[];
  downloadedFiles: string[];
}

/**
 * 보고서 검색 및 다운로드 결과
 */
export interface ReportSearchAndDownloadResult {
  message: string;
  reports: ReportDownloadResult[];
}

/**
 * 주식시장 정보 입력
 */
export interface StockMarketInfoInput {
  limit?: number;
}

/**
 * 주식시장 정보 결과
 */
export interface StockMarketInfoResult {
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
}

/**
 * 증권 보고서 입력
 */
export interface SecuritiesReportsInput {
  limit?: number;
}

/**
 * 증권 보고서 결과
 */
export interface SecuritiesReportsResult {
  message: string;
  reports: Array<{
    title: string;
    date: string;
    author: string;
    downloadUrl: string;
    hasMarkdown: boolean;
    markdownFileName?: string;
  }>;
}

/**
 * 보고서 카테고리
 */
export type ReportCategory =
  | "실적분석"
  | "시장분석"
  | "신용분석"
  | "주식분석"
  | "기타";

/**
 * 보고서 요약
 */
export interface ReportSummary {
  title: string;
  summary: string;
  category: string;
}

/**
 * 마크다운 요약 입력
 */
export interface MarkdownSummaryInput {
  limit?: number;
}

/**
 * 마크다운 요약 결과
 */
export interface MarkdownSummaryResult {
  message: string;
  summary: string;
  referencedFiles: Array<{
    fileName: string;
    date: string;
    title: string;
    content: string;
  }>;
}

/**
 * 마크다운 변환 결과
 */
export interface MarkdownConversionResult {
  success: boolean;
  fileName?: string;
  markdown?: string;
  error?: string;
}

/**
 * 동기화 결과
 */
export interface SyncResult {
  message: string;
  scrapedCount: number;
  convertedCount: number;
}

/**
 * API 응답 기본 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
