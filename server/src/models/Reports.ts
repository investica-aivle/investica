/**
 * Reports 관련 인터페이스 정의
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
 * PDF 변환 결과
 */
export default interface PdfConversionResult {
  markdown: string;
  fileName: string;
  success: boolean;
  error?: string;
}

/**
 * JSON 파일 구조 모델
 */
export interface ReportsJsonData {
  lastUpdated: string;
  lastMarkdownUpdate?: string;
  reports: MiraeAssetReport[];
}

// 사용하지 않는 모델들 (주석 처리)
/*
export interface ReportSearchInput {
  keywords: string[];
  limit?: number;
  outputDir?: string;
}

export interface ReportDownloadResult {
  reports: MiraeAssetReport[];
  downloadedFiles: string[];
}

export interface ReportSearchAndDownloadResult {
  message: string;
  reports: ReportDownloadResult[];
}

export interface ReportDownloadAndConvertInput {
  downloadUrl: string;
  outputDir?: string;
}

export interface ReportDownloadAndConvertResult {
  message: string;
  pdfFilePath: string;
  markdown: string;
  markdownFileName: string;
  success: boolean;
  error?: string;
}

export interface PdfConvertInput {
  pdfFilePath: string;
  outputDir?: string;
}

export interface PdfConvertResult {
  message: string;
  markdown: string;
  fileName: string;
  success: boolean;
  error?: string;
}

export interface StockMarketInfoInput {
  limit?: number;
  outputDir?: string;
}

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

export interface SecuritiesReportsInput {
  limit?: number;
  outputDir?: string;
}

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

export type ReportCategory =
  | "실적분석"
  | "시장분석"
  | "신용분석"
  | "주식분석"
  | "기타";

export interface ReportSummary {
  title: string;
  summary: string;
  category: string;
}

export interface MarkdownSummaryInput {
  markdownDir?: string;
  limit?: number;
}

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

export interface MarkdownConversionResult {
  success: boolean;
  fileName?: string;
  markdown?: string;
  error?: string;
}

export interface SyncResult {
  message: string;
  scrapedCount: number;
  convertedCount: number;
}
*/
