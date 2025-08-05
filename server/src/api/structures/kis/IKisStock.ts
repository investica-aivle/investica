import { tags } from "typia";

/**
 * Namespace for Korea Investment Securities (KIS) stock trading API structures
 */
export namespace IKisStock {
  /**
   * Stock order request interface for placing buy or sell orders
   */
  export interface IOrderRequest {
    /**
     * Stock code (6 digits)
     *
     * @example "005930"
     */
    stockCode: string & tags.Pattern<"^[0-9]{6}$">;

    /**
     * Order type - buy or sell
     *
     * @example "buy"
     */
    orderType: "buy" | "sell";

    /**
     * Order quantity (number of shares)
     *
     * @example 10
     */
    quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;

    /**
     * Order condition - market order or limit order
     *
     * @example "limit"
     */
    orderCondition: "market" | "limit";

    /**
     * Order price (required for limit orders, ignored for market orders)
     *
     * @example 75000
     */
    price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
  }

  /**
   * Stock order response interface
   */
  export interface IOrderResponse {
    /**
     * Whether the order was successful
     *
     * @example true
     */
    success: boolean;

    /**
     * Order ID from KIS system (only provided on successful orders)
     *
     * @example "0000117057"
     */
    orderId?: string;

    /**
     * Response message describing the result
     *
     * @example "매수 주문이 완료되었습니다."
     */
    message: string;

    /**
     * Error code from KIS system (only provided on failed orders)
     *
     * @example "40310000"
     */
    errorCode?: string;
  }
}
