import { Injectable } from "@nestjs/common";

/**
 * KIS API 관련 상수들을 관리하는 클래스
 */
@Injectable()
export class KisConstants {
  // 모의투자 API 도메인
  public static readonly VIRTUAL_DOMAIN = "https://openapivts.koreainvestment.com:29443";
  
  // 실전투자 API 도메인 (사용시 주의)
  public static readonly REAL_DOMAIN = "https://openapi.koreainvestment.com:9443";
  
  // API 엔드포인트
  public static readonly ENDPOINTS = {
    // OAuth 토큰 발급
    TOKEN: "/oauth2/tokenP",

    // 주식 주문
    STOCK_ORDER: "/uapi/domestic-stock/v1/trading/order-cash",

    // 잔고 조회
    BALANCE: "/uapi/domestic-stock/v1/trading/inquire-balance"
  };

  // TR_ID (거래 ID)
  public static readonly TR_ID = {
    // 주식 주문
    STOCK_ORDER: {
      // 모의투자
      VIRTUAL: {
        BUY: "VTTC0012U",   // 매수
        SELL: "VTTC0011U"   // 매도
      },
      // 실전투자
      REAL: {
        BUY: "TTTC0012U",   // 매수
        SELL: "TTTC0011U"   // 매도
      }
    },
    
    // 잔고조회
    BALANCE: {
      // 모의투자
      VIRTUAL: "VTTC8434R",
      // 실전투자
      REAL: "TTTC8434R"
    }
  };
  
  // 주문구분 코드
  public static readonly ORDER_DIVISION = {
    LIMIT: "00",   // 지정가
    MARKET: "01"   // 시장가
  };
  
  // 매도유형 코드
  public static readonly SELL_TYPE = {
    NORMAL: "1"    // 일반 매도
  };
  
  // 고객 유형
  public static readonly CUST_TYPE = {
    PERSONAL: "P", // 개인
    BUSINESS: "B"  // 법인
  };

  // 잔고조회 파라미터
  public static readonly BALANCE_PARAMS = {
    // 계좌상품코드 (일반적으로 01)
    ACNT_PRDT_CD: "01",

    // 시간외단일가여부
    AFHR_FLPR_YN: "N",

    // 오프라인여부
    OFL_YN: "",

    // 단가구분
    UNPR_DVSN: "01",

    // 펀드결제분포함여부
    FUND_STTL_ICLD_YN: "N",

    // 융자금액자동상환여부
    FNCG_AMT_AUTO_RDPT_YN: "N",

    // 연속조회검색조건100
    CTX_AREA_FK100: "",

    // 연속조회키100
    CTX_AREA_NK100: "",

    // 조회구분
    INQR_DVSN: {
      BY_DATE: "01",    // 대출일별
      BY_STOCK: "02"    // 종목별
    },

    // 처리구분
    PRCS_DVSN: {
      INCLUDE_PREV_DAY: "00",   // 전일매매포함
      EXCLUDE_PREV_DAY: "01"    // 전일매매미포함
    }
  };
}
