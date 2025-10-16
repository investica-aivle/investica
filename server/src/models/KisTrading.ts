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
  periodCode?: "D" | "W" | "M";
  adjustPrice?: 0 | 1;
}

/**
 * 주식 일별 가격 조회 응답
 */
export interface IStockDailyPricesResponse {
  message: string;
  data: IStockDailyPrice[];
}

/**
 * 포트폴리오 관련 인터페이스
 */
export namespace IKisPortfolio {
  /**
   * 포트폴리오 요약 정보 (PortfolioHeader용 간소화된 데이터)
   */
  export interface IPortfolioSummary {
    /**
     * 총 평가금액
     * @example 15420000
     */
    totalValue: number;

    /**
     * 평가손익금액
     * @example 320000
     */
    changeAmount: number;

    /**
     * 평가손익율
     * @example 2.12
     */
    changePercent: number;

    /**
     * 총 투자원금 (매입금액합계)
     * @example 15100000
     */
    totalInvestment: number;

    /**
     * 보유종목 수
     * @example 8
     */
    stockCount: number;

    /**
     * 요약 메시지
     * @example "8개 종목을 보유중이에요"
     */
    message: string;
  }

  /**
   * 개별 주식 보유 정보 (핵심 필드만)
   */
  export interface IStockHolding {
    /**
     * 상품번호 (종목번호 뒷 6자리)
     * @example "005930"
     */
    pdno: string;

    /**
     * 상품명 (종목명)
     * @example "삼성전자"
     */
    prdt_name: string;

    /**
     * 매매구분명
     * @example "현금"
     */
    trad_dvsn_name: string;

    /**
     * 전일매수수량
     * @example "0"
     */
    bfdy_buy_qty: string;

    /**
     * 전일매도수량
     * @example "0"
     */
    bfdy_sll_qty: string;

    /**
     * 금일매수수량
     * @example "10"
     */
    thdt_buyqty: string;

    /**
     * 금일매도수량
     * @example "0"
     */
    thdt_sll_qty: string;

    /**
     * 보유수량
     * @example "100"
     */
    hldg_qty: string;

    /**
     * 주문가능수량
     * @example "100"
     */
    ord_psbl_qty: string;

    /**
     * 매입평균가격
     * @example "75000"
     */
    pchs_avg_pric: string;

    /**
     * 매입금액
     * @example "7500000"
     */
    pchs_amt: string;

    /**
     * 현재가
     * @example "78000"
     */
    prpr: string;

    /**
     * 평가금액
     * @example "7800000"
     */
    evlu_amt: string;

    /**
     * 평가손익금액
     * @example "300000"
     */
    evlu_pfls_amt: string;

    /**
     * 평가손익율
     * @example "4.00"
     */
    evlu_pfls_rt: string;

    /**
     * 등락율
     * @example "4.00"
     */
    fltt_rt: string;

    /**
     * 전일대비증감
     * @example "3000"
     */
    bfdy_cprs_icdc: string;
  }

  /**
   * 계좌 요약 정보 (한투 API output2 전체 필드 포함)
   */
  export interface IAccountSummary {
    /**
     * 예수금총금액
     * @example "1000000"
     */
    dnca_tot_amt: string;

    /**
     * 익일정산금액 (D+1 예수금)
     * @example "1000000"
     */
    nxdy_excc_amt: string;

    /**
     * 가수도정산금액 (D+2 예수금)
     * @example "1000000"
     */
    prvs_rcdl_excc_amt: string;

    /**
     * CMA평가금액
     * @example "0"
     */
    cma_evlu_amt: string;

    /**
     * 전일���수금액
     * @example "0"
     */
    bfdy_buy_amt: string;

    /**
     * 금일매수금액
     * @example "780000"
     */
    thdt_buy_amt: string;

    /**
     * 익일자동상환금액
     * @example "0"
     */
    nxdy_auto_rdpt_amt: string;

    /**
     * 전일매도금액
     * @example "0"
     */
    bfdy_sll_amt: string;

    /**
     * 금일매도금액
     * @example "0"
     */
    thdt_sll_amt: string;

    /**
     * D+2자동상환금액
     * @example "0"
     */
    d2_auto_rdpt_amt: string;

    /**
     * 전일제비용금액
     * @example "0"
     */
    bfdy_tlex_amt: string;

    /**
     * 금일제비용금액
     * @example "156"
     */
    thdt_tlex_amt: string;

    /**
     * 총대출금액
     * @example "0"
     */
    tot_loan_amt: string;

    /**
     * 유가평가금액
     * @example "7800000"
     */
    scts_evlu_amt: string;

    /**
     * 총평가금액 (유가증권 평가금액 합계금액 + D+2 예수금)
     * @example "8800000"
     */
    tot_evlu_amt: string;

    /**
     * 순자산금액
     * @example "8800000"
     */
    nass_amt: string;

    /**
     * 융자금자동상환여부 (보유현금에 대한 융자금만 차감여부)
     * @example "N"
     */
    fncg_gld_auto_rdpt_yn: string;

    /**
     * 매입금액합계금��
     * @example "7500000"
     */
    pchs_amt_smtl_amt: string;

    /**
     * 평가금액합계금액 (유가증권 평가금액 합계금액)
     * @example "7800000"
     */
    evlu_amt_smtl_amt: string;

    /**
     * 평가손익합계금액
     * @example "300000"
     */
    evlu_pfls_smtl_amt: string;

    /**
     * 총대주매각대금
     * @example "0"
     */
    tot_stln_slng_chgs: string;

    /**
     * 전일총자산평가금액
     * @example "8500000"
     */
    bfdy_tot_asst_evlu_amt: string;

    /**
     * 자산증감액
     * @example "300000"
     */
    asst_icdc_amt: string;

    /**
     * 자산증감수익율
     * @example "3.53"
     */
    asst_icdc_erng_rt: string;
  }

  /**
   * 보유 주식 목록 조회 응답
   */
  export interface IBalanceResponse {
    /**
     * 응답 코드 (0: 성공)
     */
    rt_cd: string;

    /**
     * 응답 메시지 코드
     */
    msg_cd: string;

    /**
     * 응답 메시지
     */
    msg1: string;

    /**
     * 보유 주식 목록
     */
    output1: IStockHolding[];

    /**
     * 요약 메시지
     */
    message: string;
  }

  /**
   * 포트폴리오 전체 응답
   */
  export interface IPortfolioResponse {
    /**
     * 성공 실패 여부 (0: 성공, 0 이외의 값: 실패)
     * @example "0"
     */
    rt_cd: string;

    /**
     * 응답코드
     * @example "MCA00000"
     */
    msg_cd: string;

    /**
     * 응답메세지
     * @example "정상처리 되었습니다."
     */
    msg1: string;

    /**
     * 연속조회검색조건100
     * @example ""
     */
    ctx_area_fk100: string;

    /**
     * 연속조회키100
     * @example ""
     */
    ctx_area_nk100: string;

    /**
     * 보유 주식 목록
     */
    output1: IStockHolding[];

    /**
     * 계좌 요약 정보
     */
    output2: IAccountSummary[];

    /**
     * 요약 메시지
     * @example "5개 종목을 보유중이에요"
     */
    message: string;
  }
}

/**
 * KIS API 인증 요청 바디
 */
export interface IKisAuthRequest {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}

/**
 * KIS API 인증 응답
 */
export interface IKisAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * KIS API 공통 헤더
 */
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

/**
 * 웹소켓 접속키 발급 응답 인터페이스
 */
export interface IKisWebSocketKeyResponse {
  /**
   * 웹소켓 접속키
   *
   * @example "eSg4Sm5CTUItakpaeHoyLVgd..."
   */
  approval_key: string;
}

/**
 * 웹소켓 접속키 발급 요청 바디 (내부용)
 */
export interface IKisWebSocketKeyRequestBody {
  grant_type: "client_credentials";
  appkey: string;
  secretkey: string;
}
