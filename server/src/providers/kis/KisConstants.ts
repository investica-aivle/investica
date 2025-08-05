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
}
