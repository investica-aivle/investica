import { tags } from "typia";
import { IKisStock } from "../../api/structures/kis/IKisStock";
import { KisTradingProvider } from "./KisTradingProvider";
import { IKisSessionData } from "./KisAuthProvider";
import { StocksService } from "../stocks/StocksService";

/**
 * KIS Trading Service for Agentica Class Protocol
 *
 * This service provides KIS (Korea Investment Securities) stock trading
 * functionality for Agentica AI agents using the Class protocol.
 * It wraps the KisTradingProvider to make it compatible with Agentica's
 * function calling system.
 *
 * > If you're an A.I. chatbot and the user wants to trade Korean stocks,
 * > you should use the methods in this service to place orders and get
 * > account information. Each method contains detailed information about
 * > required parameters and return values.
 */
export class KisService {
  constructor(
    private readonly kisTradingProvider: KisTradingProvider,
    private readonly sessionData: IKisSessionData,
    private readonly stocksService: StocksService
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
    // Validate limit order has price
    if (input.orderCondition === "limit" && !input.price) {
      return {
        success: false,
        message: "Price is required for limit orders",
        errorCode: "MISSING_PRICE"
      };
    }

    // Execute the buy order using stored session data
    return await this.kisTradingProvider.executeStockOrder(this.sessionData, {
      stockCode: input.stockCode,
      orderType: "buy",
      quantity: input.quantity,
      price: input.price,
      orderCondition: input.orderCondition
    });
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
    // Validate limit order has price
    if (input.orderCondition === "limit" && !input.price) {
      return {
        success: false,
        message: "Price is required for limit orders",
        errorCode: "MISSING_PRICE"
      };
    }

    // Execute the sell order using stored session data
    return await this.kisTradingProvider.executeStockOrder(this.sessionData, {
      stockCode: input.stockCode,
      orderType: "sell",
      quantity: input.quantity,
      price: input.price,
      orderCondition: input.orderCondition
    });
    
  }
  /**
   * 주식 현재가 조회
   */
  public async getStockPrice(input: {
    /**
     * 기업명
     * @example "삼성전자"
     */
    company: string;
  }): Promise<{
    message: string;
    data: Record<string, any>;
  }> {
    const result = await this.stocksService.fetchStockPrice({ company: input.company }, this.sessionData);
    return {
      message: `${input.company}의 현재 주가 정보입니다.`,
      data: result,
    };
  }
  /**
   * 국내 주식 체결 정보 조회
   * @param input 기업명
   * @returns 체결 정보 목록
   */
  public async getStockTrades(input: {
    /**
     * 기업명
     * @example "카카오"
     */
    company: string;
  }): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    const result = await this.stocksService.fetchStockTrades(
      { company: input.company },
      this.sessionData,
    );
    return {
      message: `${input.company}의 실시간 체결 정보입니다.`,
      data: result,
    };
  }
  /**
   * 국내 주식 일자별 가격 조회 (일/주/월별)
   * @param input 기업명, 기간, 수정주가 반영 여부
   * @returns 시계열 가격 데이터
   */
  public async getStockDailyPrices(input: {
    /**
     * 기업명
     * @example "네이버"
     */
  company: string;

    /**
     * 기간 구분 (D: 일간, W: 주간, M: 월간)
     * @example "W"
     */
    periodCode?: 'D' | 'W' | 'M';

    /**
     * 수정주가 반영 여부 (0: 미반영, 1: 반영)
     * @example 1
     */
  adjustPrice?: 0 | 1;
  }): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    const result = await this.stocksService.fetchStockDailyPrices(
      {
        company: input.company,
        periodCode: input.periodCode ?? 'D',
        adjustPrice: input.adjustPrice ?? 1,
      },
      this.sessionData,
    );
    return {
      message: `${input.company}의 ${input.periodCode ?? 'D'} 단위 시세 정보입니다.`,
      data: result,
    };
  }
}
