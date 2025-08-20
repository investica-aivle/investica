import { IKisSessionData, IKisStock } from "@models/KisTrading";
import { tags } from "typia";

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
     * Stock code (6 digits)
     * @example "005930" Samsung Electronics
     * @example "035720" Kakao
     * @example "035420" NAVER
     */
    stockCode: string & tags.Pattern<"^[0-9]{6}$">;

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
    return await this.kisService.buyStock(this.sessionData, input);
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
     * Stock code (6 digits)
     * @example "005930" Samsung Electronics
     * @example "035720" Kakao
     * @example "035420" NAVER
     */
    stockCode: string & tags.Pattern<"^[0-9]{6}$">;

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
    return await this.kisService.sellStock(this.sessionData, input);
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
     * Company name
     * @example "삼성전자"
     */
    company: string;
  }): Promise<{
    message: string;
    data: Record<string, any>;
  }> {
    return await this.kisService.getStockPrice(this.sessionData, input);
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
     * Company name
     * @example "카카오"
     */
    company: string;
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
   *
   * @param input Company name, period type, and adjusted price option
   * @returns Time-series price data and trading volume information
   */
  public async getStockDailyPrices(input: {
    /**
     * Company name
     * @example "네이버"
     */
    company: string;

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
    return await this.kisService.getStockDailyPrices(this.sessionData, input);
  }

  /**
   * Get account stock balance
   *
   * Retrieve the current stock holdings in the user's account.
   * This function shows all stocks currently owned, including quantity,
   * purchase price, current price, and profit/loss information.
   *
   * > This function provides a comprehensive view of the user's portfolio.
   * > Use this before placing sell orders to check available quantities.
   * > The profit/loss information is calculated based on current market prices.
   *
   * @returns Account balance information with stock holdings
   */
  public async getStockBalance(): Promise<{
    /**
     * Summary message about the account balance
     * @example "3개 종목을 보유중이에요"
     */
    message: string;

    /**
     * List of stock holdings in the account
     */
    stocks: Array<{
      /**
       * Stock name
       * @example "삼성전자"
       */
      name: string;

      /**
       * Number of shares owned
       * @example "100"
       */
      quantity: string;

      /**
       * Average purchase price per share
       * @example "75000"
       */
      buyPrice: string;

      /**
       * Current market price per share
       * @example "78000"
       */
      currentPrice: string;

      /**
       * Profit/loss percentage
       * @example "4.00"
       */
      profit: string;
    }>;
  }> {
    return await this.kisService.getStockBalance(this.sessionData);
  }

  /**
   * Get KOSPI index prices
   *
   * Retrieve real-time KOSPI index price information.
   * Provides current KOSPI index value, price change, change rate, and trading volume.
   *
   * > Use this to check overall market conditions and trends.
   * > KOSPI index reflects the overall performance of Korean stock market.
   * > For current price only, use periodCode "D" with today's date.
   * > For historical data, specify startDate and endDate with appropriate periodCode.
   *
   * @param input Period and date range for KOSPI data
   * @returns KOSPI index price information and market data
   */
  public async getKospiPrices(input: {
    /**
     * Period type (D: Daily, W: Weekly, M: Monthly, Y: Yearly)
     * @example "D"
     */
    periodCode?: "D" | "W" | "M" | "Y";

    /**
     * Start date for data range
     * @example "20240101"
     */
    startDate?: string;

    /**
     * End date for data range
     * @example "20241231"
     */
    endDate?: string;
  }): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    return await this.kisService.getKospiPrices(this.sessionData, input);
  }
}
