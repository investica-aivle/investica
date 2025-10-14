// client/src/apis/portfolio.ts
import { apiClient } from './index';
import { SessionManager } from '../utils/sessionManager';

// 포트폴리오 요약 데이터 타입 정의
export interface PortfolioSummary {
  /**
   * 총 평가금액
   */
  totalValue: number;

  /**
   * 평가손익금액
   */
  changeAmount: number;

  /**
   * 평가손익율
   */
  changePercent: number;

  /**
   * 총 투자원금 (매입금액합계)
   */
  totalInvestment: number;

  /**
   * 보유종목 수
   */
  stockCount: number;

  /**
   * 요약 메시지
   */
  message: string;
}

// 보유 주식 상세 정보 타입 정의 (서버 API와 일치)
export interface StockHolding {
  /**
   * 상품번호 (종목번호 뒷 6자리)
   */
  pdno: string;

  /**
   * 상품명 (종목명)
   */
  prdt_name: string;

  /**
   * 매매구분명
   */
  trad_dvsn_name: string;

  /**
   * 보유수량
   */
  hldg_qty: string;

  /**
   * 주문가능수량
   */
  ord_psbl_qty: string;

  /**
   * 매입평균가격
   */
  pchs_avg_pric: string;

  /**
   * 매입금액
   */
  pchs_amt: string;

  /**
   * 현재가
   */
  prpr: string;

  /**
   * 평가금액
   */
  evlu_amt: string;

  /**
   * 평가손익금액
   */
  evlu_pfls_amt: string;

  /**
   * 평가손익율
   */
  evlu_pfls_rt: string;

  /**
   * 등락율
   */
  fltt_rt: string;

  /**
   * 전일대비증감
   */
  bfdy_cprs_icdc: string;
}

// 계좌 정보 타입 정의
export interface AccountInfo {
  /**
   * 예수금총금액 (현금)
   */
  dnca_tot_amt: string;

  /**
   * 익일정산금액 (D+1 예수금)
   */
  nxdy_excc_amt: string;

  /**
   * 가수도정산금액 (D+2 예수금)
   */
  prvs_rcdl_excc_amt: string;

  /**
   * CMA평가금액
   */
  cma_evlu_amt: string;

  /**
   * 전일매수금액
   */
  bfdy_buy_amt: string;

  /**
   * 금일매수금액
   */
  thdt_buy_amt: string;

  /**
   * 익일자동상환금액
   */
  nxdy_auto_rdpt_amt: string;

  /**
   * 전일매도금액
   */
  bfdy_sll_amt: string;

  /**
   * 금일매도금액
   */
  thdt_sll_amt: string;

  /**
   * D+2자동상환금액
   */
  d2_auto_rdpt_amt: string;

  /**
   * 전일제비용금액
   */
  bfdy_tlex_amt: string;

  /**
   * 금일제비용금액
   */
  thdt_tlex_amt: string;

  /**
   * 총대출금액
   */
  tot_loan_amt: string;

  /**
   * 유가평가금액 (주식 평가금액)
   */
  scts_evlu_amt: string;

  /**
   * 총평가금액 (유가증권 평가금액 합계금액 + D+2 예수금)
   */
  tot_evlu_amt: string;

  /**
   * 순자산금액
   */
  nass_amt: string;

  /**
   * 융자금액
   */
  fncg_amt: string;

  /**
   * 융자원리금
   */
  fncg_orgn_amt: string;

  /**
   * 매입금액합계금액 (총 투자원금)
   */
  pchs_amt_smtl_amt: string;

  /**
   * 평가손익합계금액
   */
  evlu_pfls_smtl_amt: string;

  /**
   * 평가수익율
   */
  evlu_erng_rt: string;

  /**
   * 가수금
   */
  wghn_pdno: string;

  /**
   * 당일실현손익율
   */
  thdt_tlex_rt: string;
}

// 포트폴리오 전체 데이터 타입 정의
export interface PortfolioData {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  ctx_area_fk100: string;
  ctx_area_nk100: string;
  output1: StockHolding[];
  output2: AccountInfo[];
  message: string;
}

// API 에러 타입 정의
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * 포트폴리오 요약 정보 조회
 * 헤더에 표시할 핵심 포트폴리오 지표들을 가져옵니다.
 */
export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  try {
    // 세션 상태 확인
    const session = SessionManager.restoreSession();
    if (!session || !session.isAuthenticated) {
      throw new Error('인증이 필요합니다. 로그인을 다시 해주세요.');
    }

    const response = await apiClient.post<PortfolioSummary>('/api/kis/portfolio-summary');

    return response.data;
  } catch (error: any) {
    console.error('포트폴리오 요약 정보 조회 실패:', error);

    // 에러 타입별 처리
    if (error.response) {
      // 서버에서 응답을 받았지만 에러 상태
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else if (status === 403) {
        throw new Error('포트폴리오 정보에 접근할 권한이 없습니다.');
      } else if (status === 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error(`API 오류 (${status}): ${message}`);
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못함
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    } else {
      // 요청 설정 중 오류
      throw new Error(error.message || '알 수 없는 오류가 발생했습니다.');
    }
  }
};

/**
 * 포트폴리오 전체 데이터 조회 (보유 주식 목록 포함)
 */
export const getPortfolioData = async (): Promise<PortfolioData> => {
  try {
    // 세션 상태 확인
    const session = SessionManager.restoreSession();
    if (!session || !session.isAuthenticated) {
      throw new Error('인증이 필요합니다. 로그인을 다시 해주세요.');
    }

    const response = await apiClient.post<PortfolioData>('/api/kis/portfolio-data');

    return response.data;
  } catch (error: any) {
    console.error('포트폴리오 전체 데이터 조회 실패:', error);

    // 동일한 에러 처리 로직
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else if (status === 403) {
        throw new Error('포트폴리오 정보에 접근할 권한이 없습니다.');
      } else if (status === 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error(`API 오류 (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    } else {
      throw new Error(error.message || '알 수 없는 오류가 발생했습니다.');
    }
  }
};

/**
 * 보유 주식 목록만 조회하는 함수
 */
export const getStockHoldings = async (): Promise<StockHolding[]> => {
  try {
    // 세션 상태 확인
    const session = SessionManager.restoreSession();
    if (!session || !session.isAuthenticated) {
      throw new Error('인증이 필요합니다. 로그인을 다시 해주세요.');
    }

    // 보유 주식 목록만 직접 조회
    const response = await apiClient.get<StockHolding[]>('/api/kis/holdings');
    return response.data;
  } catch (error: any) {
    console.error('보유 주식 목록 조회 실패:', error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else if (status === 403) {
        throw new Error('포트폴리오 정보에 접근할 권한이 없습니다.');
      } else if (status === 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error(`API 오류 (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    } else {
      throw new Error(error.message || '알 수 없는 오류가 발생했습니다.');
    }
  }
};
