import { tags } from "typia";

/**
 * KIS Trading 관련 인터페이스 정의
 */

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

/**
 * KIS API 주문 요청 바디 (내부용)
 */
export interface IKisOrderRequestBody {
  CANO: string; // 종합계좌번호 (8자리)
  ACNT_PRDT_CD: string; // 계좌상품코드 (2자리)
  PDNO: string; // 상품번호 (종목코드 6자리)
  SLL_TYPE?: string; // 매도유형 (매도주문 시)
  ORD_DVSN: string; // 주문구분 (00:지정가, 01:시장가)
  ORD_QTY: string; // 주문수량
  ORD_UNPR: string; // 주문단가
  CNDT_PRIC?: string; // 조건가격
  EXCG_ID_DVSN_CD?: string; // 거래소ID구분코드
}

/**
 * KIS API 주문 응답 output (내부용)
 */
export interface IKisOrderOutput {
  KRX_FWDG_ORD_ORGNO: string; // 거래소코드
  ODNO: string; // 주문번호
  ORD_TMD: string; // 주문시간
}

/**
 * KIS API 주문 응답 (내부용)
 */
export interface IKisOrderApiResponse {
  rt_cd: string; // 성공실패여부 (0:성공)
  msg_cd: string; // 응답코드
  msg1: string; // 응답메시지
  output?: IKisOrderOutput[]; // 응답상세
}

/**
 * KIS 세션 데이터
 */
export interface IKisSessionData {
  accessToken: string;
  appKey: string;
  appSecret: string;
  accountNumber: string;
  expiresAt: Date;
}

/**
 * 주식 현재가 정보
 */
export interface IStockPrice {
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
export interface IStockTrade {
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
export interface IStockDailyPrice {
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
export interface IStockPriceRequest {
  company: string;
}

/**
 * 주식 시세 조회 응답
 */
export interface IStockPriceResponse {
  message: string;
  data: IStockPrice;
}

/**
 * 주식 체결 정보 조회 요청
 */
export interface IStockTradesRequest {
  company: string;
}

/**
 * 주식 체결 정보 조회 응답
 */
export interface IStockTradesResponse {
  message: string;
  data: IStockTrade[];
}

/**
 * 주식 일별 가격 조회 요청
 */
export interface IStockDailyPricesRequest {
  company: string;
  periodCode?: "D" | "W" | "M"; // D: 일간, W: 주간, M: 월간
  adjustPrice?: 0 | 1; // 0: 미반영, 1: 반영
}

/**
 * 주식 일별 가격 조회 응답
 */
export interface IStockDailyPricesResponse {
  message: string;
  data: IStockDailyPrice[];
}

export interface IKisAuthRequest {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}

export interface IKisAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface IKisApiHeaders {
  "content-type": string;
  authorization: string;
  appkey: string;
  appsecret: string;
  tr_id: string;
  custtype: string;
  tr_cont?: string; // 연속조회용 (GET API)
  hashkey?: string; // POST API용
}

// 계좌번호 파싱 결과
export interface IAccountNumberParts {
  CANO: string; // 종합계좌번호 (8자리)
  ACNT_PRDT_CD: string; // 계좌상품코드 (2자리)
}
