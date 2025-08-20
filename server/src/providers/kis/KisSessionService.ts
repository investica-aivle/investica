import { IKisSessionData, IKisStock, IKisPortfolio } from "@models/KisTrading";
import { tags } from "typia";
import { IClientEvents } from "../../types/agentica";

import { KisService } from "./KisService";

/**
 * KIS Session-based Trading Service for Agentica Class Protocol (Stateful)
 *
 * This service provides KIS (Korea Investment Securities) stock trading
 * functionality for Agentica AI agents using the Class protocol.
 * It maintains session data internally for persistent user sessions.
 *
 * > If you're an A.I. chatbot and the user wants to trade Korean stocks,
 * > you should use the methods in this service to place orders and get
 * > account information. Each method contains detailed information about
 * > required parameters and return values.
 */
export class KisSessionService {
  constructor(
    private readonly kisService: KisService,
    private readonly sessionData: IKisSessionData,
    private readonly listener?: IClientEvents,
  ) {}

  /**
   * Execute stock buy order
   *
   * Place a buy order for Korean stocks through KIS OpenAPI.
   * This function allows you to buy stocks using either market orders
   * (executed at the current market price) or limit orders (executed
   * only at the specified price or better).
   *
   * > For limit orders, you must specify a price. Market orders will
   * > be executed at the best available price regardless of the price field.
   * > Always check current market conditions before placing market orders.
   *
   * @param input Stock buy order request details
   * @returns Order execution result with success status and details
   */
  public async buyStock(input: {
    /**
     * Stock name (Korean)
     * @example "삼성전자" Samsung Electronics
     * @example "카카오" Kakao
     * @example "네이버" NAVER
     */
    stockName: string;

    /**
     * Order quantity (number of shares)
     * @minimum 1
     * @example 10
     */
    quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;

    /**
     * Order condition - market order or limit order
     * @example "limit" Execute only at specified price or better
     * @example "market" Execute immediately at current market price
     */
    orderCondition: "market" | "limit";

    /**
     * Order price (required for limit orders, ignored for market orders)
     * @minimum 1
     * @example 75000
     */
    price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
  }): Promise<IKisStock.IOrderResponse> {
    return await this.kisService.buyStock(this.sessionData, input, this.listener);
  }

  /**
   * Execute stock sell order
   *
   * Place a sell order for Korean stocks through KIS OpenAPI.
   * This function allows you to sell stocks using either market orders
   * (executed at the current market price) or limit orders (executed
   * only at the specified price or better).
   *
   * > For limit orders, you must specify a price. Market orders will
   * > be executed at the best available price regardless of the price field.
   * > Always verify that the user owns the stocks before placing a sell order.
   *
   * @param input Stock sell order request details
   * @returns Order execution result with success status and details
   */
  public async sellStock(input: {
    /**
     * Stock name (Korean)
     * @example "삼성전자" Samsung Electronics
     * @example "카카오" Kakao
     * @example "네이버" NAVER
     */
    stockName: string;

    /**
     * Order quantity (number of shares)
     * @minimum 1
     * @example 10
     */
    quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;

    /**
     * Order condition - market order or limit order
     * @example "limit" Execute only at specified price or better
     * @example "market" Execute immediately at current market price
     */
    orderCondition: "market" | "limit";

    /**
     * Order price (required for limit orders, ignored for market orders)
     * @minimum 1
     * @example 75000
     */
    price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
  }): Promise<IKisStock.IOrderResponse> {
    return await this.kisService.sellStock(this.sessionData, input, this.listener);
  }

  /**
   * Get current stock price
   *
   * Retrieve real-time stock price information for a specific company.
   * Provides current price, price change from previous day, change rate, trading volume, etc.
   *
   * > Use this to check current market price before trading stocks.
   * > Real-time data helps you understand accurate market conditions.
   *
   * @param input Company information to query
   * @returns Stock price information and detailed data
   */
  public async getStockPrice(input: {
    /**
     * Stock name (Korean)
     * @example "삼성전자"
     */
    stockName: string;
  }): Promise<{
    message: string;
    data: Record<string, any>;
  }> {
    return await this.kisService.getStockPrice(this.sessionData, input, this.listener);
  }

  /**
   * Get stock trade execution information
   *
   * Retrieve real-time trade execution history for a specific company.
   * Shows recent executed trades including time, price, and quantity information.
   *
   * > Use this to understand stock trading flow patterns.
   * > Helps determine optimal buy/sell timing.
   *
   * @param input Company information to query
   * @returns Trade execution information list and transaction history
   */
  public async getStockTrades(input: {
    /**
     * Stock name (Korean)
     * @example "카카오"
     */
    stockName: string;
  }): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    return await this.kisService.getStockTrades(this.sessionData, input);
  }

  /**
   * Get stock daily price data (daily/weekly/monthly)
   *
   * Retrieve historical stock price data for a specific company in daily/weekly/monthly intervals.
   * Provides time-series data including open, high, low, close prices and trading volume.
   *
   * > Use this to analyze historical trends and create charts.
   * > Useful for technical analysis and investment pattern analysis.
   * > ALWAYS present results in markdown table format using | (pipes) and - (hyphens).
   * > Table structure: | 날짜 | 시가 | 고가 | 저가 | 종가 | 거래량 |
   * > Example: |2024-01-15|75,000원|78,000원|74,500원|77,500원|1,234,567주|
   *
   * @param input Company name, period type, and adjusted price option
   * @returns Time-series price data and trading volume information
   */
  public async getStockDailyPrices(input: {
    /**
     * Stock name (Korean)
     * @example "네이버"
     */
    stockName: string;

    /**
     * Period type (D: Daily, W: Weekly, M: Monthly)
     * @example "W"
     */
    periodCode?: "D" | "W" | "M";

    /**
     * Adjusted price option (0: Not adjusted, 1: Adjusted)
     * @example 1
     */
    adjustPrice?: 0 | 1;
  }): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    return await this.kisService.getStockDailyPrices(this.sessionData, input, this.listener);
  }

  /**
   * Get comprehensive portfolio data
   *
   * Retrieve complete portfolio information including all stock holdings,
   * account summary, and detailed financial metrics from KIS API.
   * This function provides the full dataset needed for portfolio analysis.
   *
   * > Present data in user-friendly format: 1) Overview message 2) Holdings summary
   * > 3) Individual stocks MUST be presented in markdown table format using | (pipes) and - (hyphens).
   * > Stock table structure: | 종목명 | 보유수량 | 매입평균가 | 현재가 | 평가금액 | 평가손익 | 수익률 |
   * > Example: |삼성전자|10주|75,000원|78,000원|780,000원|+30,000원|+4.0%|
   * > 4) Account summary table: | 항목 | 금액 | with deposits (예수금: 추가 매수 가능 현금),
   * > total value (총 평가금액), net assets (순자산). Use Korean won notation (원),
   * > +/- indicators, avoid technical field names like pdno/prdt_name.
   * > Include beginner explanations in parentheses.
   *
   * @returns Complete portfolio data with all KIS API fields
   */
  public async getPortfolioData(): Promise<IKisPortfolio.IPortfolioResponse> {
    return await this.kisService.getPortfolioData(this.sessionData);
  }

  /**
   * Get portfolio summary for header
   *
   * Retrieve essential portfolio metrics optimized for the portfolio header display.
   * This function provides only the key information needed for the main portfolio overview.
   *
   * > Present summary in friendly format with overview message. Show key metrics with
   * > Korean won (원), +/- indicators, natural expressions (예: "5개 종목 보유중").
   * > Include: total value (총 평가금액: 주식과 현금 합친 총 가치), profit/loss
   * > (평가손익: 번 돈 또는 잃은 돈), return % (수익률: 원금 대비 퍼센트),
   * > investment (총 투자원금: 주식 사는데 쓴 돈), holdings count (보유종목 수:
   * > 가진 회사 주식 개수), available cash (가용자금: 추가 매수 가능 현금).
   * > Use comma separators, conversational tone with beginner explanations.
   *
   * @returns Simplified portfolio summary for header display
   */
  public async getPortfolioSummary(): Promise<IKisPortfolio.IPortfolioSummary> {
    return await this.kisService.getPortfolioSummary(this.sessionData);
  }
}
