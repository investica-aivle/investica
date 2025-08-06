/**
 * Reports 관련 인터페이스 정의
 */

/**
 * 미래에셋증권 보고서 정보
 */
export interface MiraeAssetReport {
  title: string;
  date: string;
  author: string;
  downloadUrl: string;
  fileName: string;
  category: string;
}

/**
 * PDF 변환 결과
 */
export interface PdfConversionResult {
  markdown: string;
  fileName: string;
  success: boolean;
  error?: string;
}

/**
 * 보고서 검색 조건
 */
export interface ReportSearchInput {
  keywords: string[];
  limit?: number;
  outputDir?: string;
}

/**
 * 보고서 다운로드 및 변환 결과
 */
export interface ReportDownloadResult {
  title: string;
  date: string;
  author: string;
  markdown: string;
  markdownFileName: string;
  success: boolean;
  error?: string;
}

/**
 * 보고서 검색 및 다운로드 결과
 */
export interface ReportSearchAndDownloadResult {
  message: string;
  reports: ReportDownloadResult[];
}

/**
 * 보고서 다운로드 및 변환 요청
 */
export interface ReportDownloadAndConvertInput {
  downloadUrl: string;
  outputDir?: string;
}

/**
 * 보고서 다운로드 및 변환 결과
 */
export interface ReportDownloadAndConvertResult {
  message: string;
  pdfFilePath: string;
  markdown: string;
  markdownFileName: string;
  success: boolean;
  error?: string;
}

/**
 * PDF 변환 요청
 */
export interface PdfConvertInput {
  pdfFilePath: string;
  outputDir?: string;
}

/**
 * PDF 변환 결과 (Service용)
 */
export interface PdfConvertResult {
  message: string;
  markdown: string;
  fileName: string;
  success: boolean;
  error?: string;
}

/**
 * 주식시장 정보 요청
 */
export interface StockMarketInfoInput {
  limit?: number;
  outputDir?: string;
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
 * 증권보고서 요청
 */
export interface SecuritiesReportsInput {
  limit?: number;
  outputDir?: string;
}

/**
 * 증권보고서 결과
 */
export interface SecuritiesReportsResult {
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
 * 보고서 요약 정보
 */
export interface ReportSummary {
  title: string;
  summary: string;
  category: string;
}
