/**
 * Stock 관련 클라이언트 타입 정의
 */

/**
 * 주식 정보
 */
export interface Stock {
  rank: number;
  stockCode: string;
  stockName: string;
  marketCap: number;
  changeRate: number;
  currentPrice: number;
  changeAmount: number;
  marketCategory: string;
}

/**
 * 주식 개요 응답
 */
export interface StockOverviewResponse {
  message: string;
  stocks: Stock[];
  totalCount: number;
}

/**
 * 주식 현재가 정보
 */
export interface StockPrice {
  stockCode: string;
  companyName: string;
  currentPrice: number;
  changeAmount: number;
  changeRate: number;
  volume: number;
  marketCap: number;
  timestamp: Date;
}

/**
 * 주식 체결 정보
 */
export interface StockTrade {
  stockCode: string;
  companyName: string;
  price: number;
  quantity: number;
  tradeTime: Date;
  tradeType: "buy" | "sell";
}

/**
 * 주식 일별 가격 정보
 */
export interface StockDailyPrice {
  stockCode: string;
  companyName: string;
  date: Date;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  adjustPrice: number;
}

/**
 * 주식 시세 조회 요청
 */
export interface StockPriceRequest {
  company: string;
}

/**
 * 주식 시세 조회 응답
 */
export interface StockPriceResponse {
  message: string;
  data: StockPrice;
}

/**
 * 주식 체결 정보 조회 요청
 */
export interface StockTradesRequest {
  company: string;
}

/**
 * 주식 체결 정보 조회 응답
 */
export interface StockTradesResponse {
  message: string;
  data: StockTrade[];
}

/**
 * 주식 일별 가격 조회 요청
 */
export interface StockDailyPricesRequest {
  company: string;
  periodCode?: "D" | "W" | "M"; // D: 일간, W: 주간, M: 월간
  adjustPrice?: 0 | 1; // 0: 미반영, 1: 반영
}

/**
 * 주식 일별 가격 조회 응답
 */
export interface StockDailyPricesResponse {
  message: string;
  data: StockDailyPrice[];
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
