import { tags } from "typia";
import { IKisStock } from "../../api/structures/kis/IKisStock";
import { KisTradingProvider } from "./KisTradingProvider";
import { IKisSessionData } from "./KisAuthProvider";

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
}
