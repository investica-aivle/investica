import { TypedBody, TypedRoute } from "@nestia/core";
import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from "@nestjs/common";

import { Session } from "../../decorators/session.decorators";
import { SessionGuard } from "../../guards/SessionGuard";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";
import { KisService } from "../../providers/kis/KisService";
import {
  ISessionData,
  SessionManager,
} from "../../providers/session/SessionManager";
import { MaskingUtil } from "../../utils/MaskingUtil";
import { IKisAuthRequestDto, IKisAuthResponseDto } from "./dto/KisAuthDto";

/**
 * KIS (Korea Investment Securities) REST API Controller
 *
 * 한국투자증권 관련 REST API 엔드포인트를 제공합니다.
 */
@Controller("api/kis")
export class KisController {
  private readonly logger = new Logger(KisController.name);

  constructor(
    private readonly kisAuthProvider: KisAuthProvider,
    private readonly kisService: KisService,
    private readonly sessionManager: SessionManager,
  ) {}

  /**
   * KIS OAuth 인증을 수행합니다.
   *
   * 계좌번호, App Key, App Secret을 받아서 KIS API에 OAuth 인증을 요청하고,
   * 성공 시 세션을 생성하여 세션 키와 마스킹된 계좌번호를 반환합니다.
   *
   * @summary KIS OAuth 인증
   * @param body 인증 요청 데이터
   * @returns 인증 결과 (세션 키 및 마스킹된 계좌번호)
   */
  @TypedRoute.Post("auth")
  @HttpCode(HttpStatus.OK)
  public async authenticate(
    @TypedBody() body: IKisAuthRequestDto,
  ): Promise<IKisAuthResponseDto> {
    const maskedAppKey = MaskingUtil.maskAppKey(body.appKey);
    const maskedAccountNumber = MaskingUtil.maskAccountNumber(
      body.accountNumber,
    );

    this.logger.log(`=== KIS OAuth 인증 시작 ===`);
    this.logger.log(`계좌번호: ${maskedAccountNumber}`);
    this.logger.log(`App Key: ${maskedAppKey}`);

    try {
      // KIS OAuth 인증 수행
      const kisSessionData = await this.kisAuthProvider.authenticate({
        accountNumber: body.accountNumber,
        appKey: body.appKey,
        appSecret: body.appSecret,
      });

      this.logger.log(`=== KIS OAuth 인증 성공 ===`);
      this.logger.log(
        `액세스 토큰 만료시간: ${kisSessionData.expiresAt.toISOString()}`,
      );

      // 세션 생성
      const { sessionKey } = this.sessionManager.createSession(kisSessionData);
      const createdAt = new Date();

      // 만료까지 남은 시간 계산 (초 단위)
      const expiresInSeconds = Math.floor(
        (kisSessionData.expiresAt.getTime() - createdAt.getTime()) / 1000,
      );

      // 계좌 타입 결정 (실전/모의)
      const accountType = this.determineAccountType(body.accountNumber);

      this.logger.log(`=== 세션 생성 완료 ===`);
      this.logger.log(`세션 키: ${MaskingUtil.maskSessionKey(sessionKey)}`);
      this.logger.log(`계좌 타입: ${accountType}`);
      this.logger.log(`토큰 만료: ${expiresInSeconds}초 후`);

      return {
        success: true,
        sessionKey,
        maskedAccountNumber,
        expiresAt: kisSessionData.expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
        expiresInSeconds,
        accountType,
      };
    } catch (error) {
      this.logger.error(`=== KIS OAuth 인증 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      // 상세 에러 정보 구성
      const errorDetails = this.buildErrorDetails(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "인증에 실패했습니다.",
        errorCode: "AUTH_FAILED",
        errorDetails,
      };
    }
  }
  /**
   * 로그아웃을 수행합니다.
   *
   * Authorization 헤더의 Bearer 토큰(세션 키)을 검증하고,
   * 해당 세션을 제거하여 로그아웃을 처리합니다.
   *
   * @summary 로그아웃
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 로그아웃 결과
   */
  @TypedRoute.Post("logout")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async logout(@Session() session: ISessionData): Promise<{
    success: boolean;
    message: string;
    loggedOutAt: string;
  }> {
    const maskedSessionKey = MaskingUtil.maskSessionKey(session.sessionKey);
    const maskedAccountNumber = MaskingUtil.maskAccountNumber(
      session.kisSessionData.accountNumber,
    );

    this.logger.log(`=== 로그아웃 요청 시작 ===`);
    this.logger.log(`세션 키: ${maskedSessionKey}`);
    this.logger.log(`계좌번호: ${maskedAccountNumber}`);

    try {
      // 세션 제거
      const removed = this.sessionManager.removeSession(session.id);

      if (!removed) {
        this.logger.warn(`=== 세션 제거 실패 ===`);
        this.logger.warn(
          `세션이 이미 제거되었거나 존재하지 않음: ${session.id}`,
        );
      }

      const loggedOutAt = new Date().toISOString();

      this.logger.log(`=== 로그아웃 완료 ===`);
      this.logger.log(`세션 키: ${maskedSessionKey}`);
      this.logger.log(`로그아웃 시간: ${loggedOutAt}`);

      return {
        success: true,
        message: "로그아웃이 완료되었습니다.",
        loggedOutAt,
      };
    } catch (error) {
      this.logger.error(`=== 로그아웃 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      throw error;
    }
  }

  /**
   * 국내 주식 일자별 가격을 조회합니다.
   *
   * @summary 주식 일자별 가격 조회
   * @param body 일자별 가격 조회 요청 데이터
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 일자별 가격 데이터
   */
  @TypedRoute.Post("daily-prices")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async getStockDailyPrices(
    @TypedBody()
    body: {
      stockName: string;
      periodCode?: "D" | "W" | "M";
      adjustPrice?: 0 | 1;
    },
    @Session() session: ISessionData,
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    this.logger.log(`=== 주식 일자별 가격 조회 요청 ===`);
    this.logger.log(`종목명: ${body.stockName}`);
    this.logger.log(`기간 구분: ${body.periodCode || 'D'}`);
    this.logger.log(`수정주가: ${body.adjustPrice ?? 1}`);

    try {
      const result = await this.kisService.getStockDailyPrices(
        session.kisSessionData,
        {
          stockName: body.stockName,
          periodCode: body.periodCode,
          adjustPrice: body.adjustPrice,
        }
      );

      this.logger.log(`=== 주식 일자별 가격 조회 성공 ===`);
      this.logger.log(`조회된 데이터 수: ${result.data.length}개`);

      return result;
    } catch (error) {
      this.logger.error(`=== 주식 일자별 가격 조회 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      throw error;
    }
  }

  /**
   * 코스피 지수 일/주/월/년 시세를 조회합니다.
   *
   * @summary 코스피 지수 시세 조회
   * @param body 코스피 지수 시세 조회 요청 데이터
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 코스피 지수 시세 데이터
   */
  @TypedRoute.Post("kospi-prices")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async getKospiPrices(
    @TypedBody()
    body: {
      periodCode?: "D" | "W" | "M" | "Y";
      startDate?: string;
      endDate?: string;
    },
    @Session() session: ISessionData,
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    this.logger.log(`=== 코스피 지수 시세 조회 요청 ===`);
    this.logger.log(`기간 구분: ${body.periodCode || "D"}`);
    this.logger.log(`시작일: ${body.startDate || "기본값"}`);
    this.logger.log(`종료일: ${body.endDate || "기본값"}`);

    try {
      const result = await this.kisService.getKospiPrices(
        session.kisSessionData,
        {
          periodCode: body.periodCode,
          startDate: body.startDate,
          endDate: body.endDate,
        },
      );

      this.logger.log(`=== 코스피 지수 시세 조회 성공 ===`);
      this.logger.log(`조회된 데이터 수: ${result.data.length}개`);

      return result;
    } catch (error) {
      this.logger.error(`=== 코스피 지수 시세 조회 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      throw error;
    }
  }

  /**
   * 주식 현재가를 조회합니다.
   *
   * @summary 주식 현재가 조회
   * @param body 현재가 조회 요청 데이터
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 현재가 데이터
   */
  @TypedRoute.Post("stock-price")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async getStockPrice(
    @TypedBody()
    body: {
      company: string;
    },
    @Session() session: ISessionData,
  ): Promise<{
    message: string;
    data: Record<string, any>;
  }> {
    this.logger.log(`=== 주식 현재가 조회 요청 ===`);
    this.logger.log(`기업명: ${body.company}`);

    try {
      const result = await this.kisService.getStockPrice(
        session.kisSessionData,
        {
          stockName: body.company,
        },
      );

      this.logger.log(`=== 주식 현재가 조회 성공 ===`);

      return result;
    } catch (error) {
      this.logger.error(`=== 주식 현재가 조회 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      throw error;
    }
  }

  /**
   * 주식 체결 정보를 조회합니다.
   *
   * @summary 주식 체결 정보 조회
   * @param body 체결 정보 조회 요청 데이터
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 체결 정보 데이터
   */
  @TypedRoute.Post("stock-trades")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async getStockTrades(
    @TypedBody()
    body: {
      company: string;
    },
    @Session() session: ISessionData,
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    this.logger.log(`=== 주식 체결 정보 조회 요청 ===`);
    this.logger.log(`기업명: ${body.company}`);

    try {
      const result = await this.kisService.getStockTrades(
        session.kisSessionData,
        {
          stockName: body.company,
        },
      );

      this.logger.log(`=== 주식 체결 정보 조회 성공 ===`);
      this.logger.log(`조회된 데이터 수: ${result.data.length}개`);

      return result;
    } catch (error) {
      this.logger.error(`=== 주식 체결 정보 조회 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      throw error;
    }
  }

  /**
   * 주식 매수 주문을 실행합니다.
   *
   * @summary 주식 매수
   * @param body 매수 주문 요청 데이터
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 매수 주문 실행 결과
   */
  @TypedRoute.Post("buy")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async buyStock(
    @TypedBody() body: {
      stockName: string;
      quantity: number;
      orderCondition: "market" | "limit";
      price?: number;
    },
    @Session() session: ISessionData,
  ): Promise<{
    success: boolean;
    message: string;
    orderData?: any;
    errorCode?: string;
  }> {
    this.logger.log(`=== 주식 매수 주문 요청 ===`);
    this.logger.log(`종목명: ${body.stockName}`);
    this.logger.log(`수량: ${body.quantity}`);
    this.logger.log(`주문조건: ${body.orderCondition}`);
    this.logger.log(`가격: ${body.price || '시장가'}`);

    try {
      const result = await this.kisService.buyStock(
        session.kisSessionData,
        {
          stockName: body.stockName,
          quantity: body.quantity,
          orderCondition: body.orderCondition,
          price: body.price,
        }
      );

      this.logger.log(`=== 주식 매수 주문 결과 ===`);
      this.logger.log(`성공 여부: ${result.success}`);
      this.logger.log(`메시지: ${result.message}`);

      return {
        success: result.success,
        message: result.message,
        orderData: result.success ? result : undefined,
        errorCode: result.success ? undefined : result.errorCode,
      };
    } catch (error) {
      this.logger.error(`=== 주식 매수 주문 실패 ===`);
      this.logger.error(`오류: ${error instanceof Error ? error.message : String(error)}`);

      return {
        success: false,
        message: "매수 주문 처리 중 오류가 발생했습니다.",
        errorCode: "ORDER_PROCESSING_ERROR",
      };
    }
  }

  /**
   * 주식 매도 주문을 실행합니다.
   *
   * @summary 주식 매도
   * @param body 매도 주문 요청 데이터
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 매도 주문 실행 결과
   */
  @TypedRoute.Post("sell")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async sellStock(
    @TypedBody() body: {
      stockName: string;
      quantity: number;
      orderCondition: "market" | "limit";
      price?: number;
    },
    @Session() session: ISessionData,
  ): Promise<{
    success: boolean;
    message: string;
    orderData?: any;
    errorCode?: string;
  }> {
    this.logger.log(`=== 주식 매도 주문 요청 ===`);
    this.logger.log(`종목명: ${body.stockName}`);
    this.logger.log(`수량: ${body.quantity}`);
    this.logger.log(`주문조건: ${body.orderCondition}`);
    this.logger.log(`가격: ${body.price || '시장가'}`);

    try {
      const result = await this.kisService.sellStock(
        session.kisSessionData,
        {
          stockName: body.stockName,
          quantity: body.quantity,
          orderCondition: body.orderCondition,
          price: body.price,
        }
      );

      this.logger.log(`=== 주식 매도 주문 결과 ===`);
      this.logger.log(`성공 여부: ${result.success}`);
      this.logger.log(`메시지: ${result.message}`);

      return {
        success: result.success,
        message: result.message,
        orderData: result.success ? result : undefined,
        errorCode: result.success ? undefined : result.errorCode,
      };
    } catch (error) {
      this.logger.error(`=== 주식 매도 주문 실패 ===`);
      this.logger.error(`오류: ${error instanceof Error ? error.message : String(error)}`);

      return {
        success: false,
        message: "매도 주문 처리 중 오류가 발생했습니다.",
        errorCode: "ORDER_PROCESSING_ERROR",
      };
    }
  }

  /**
   * 전체 포트폴리오 데이터 조회
   *
   * @summary 전체 포트폴리오 데이터 조회 (한투 API 핵심 필드만)
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 전체 포트폴리오 데이터 (보유종목, 계좌요약 정보 포함)
   */
  @TypedRoute.Post("portfolio-data")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async getPortfolioData(@Session() session: ISessionData): Promise<{
    /**
     * 성공 실패 여부 (0: 성공, 0 이외의 값: 실패)
     */
    rt_cd: string;

    /**
     * 응답코드
     */
    msg_cd: string;

    /**
     * 응답메세지
     */
    msg1: string;

    /**
     * 연속조회검색조건100
     */
    ctx_area_fk100: string;

    /**
     * 연속조회키100
     */
    ctx_area_nk100: string;

    /**
     * 보유 주식 목록
     */
    output1: Array<{
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
       * 전일매수수량
       */
      bfdy_buy_qty: string;

      /**
       * 전일매도수량
       */
      bfdy_sll_qty: string;

      /**
       * 금일매수수량
       */
      thdt_buyqty: string;

      /**
       * 금일매도수량
       */
      thdt_sll_qty: string;

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
    }>;

    /**
     * 계좌 요약 정��
     */
    output2: Array<{
      /**
       * 예수금총금액
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
       * 유가평가금액
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
       * 융자금자동상환여부
       */
      fncg_gld_auto_rdpt_yn: string;

      /**
       * 매입금액합계금액
       */
      pchs_amt_smtl_amt: string;

      /**
       * 평가금액합계금액 (유가증권 평가금액 합계금액)
       */
      evlu_amt_smtl_amt: string;

      /**
       * 평가손익합계금액
       */
      evlu_pfls_smtl_amt: string;

      /**
       * 총대주매각대금
       */
      tot_stln_slng_chgs: string;

      /**
       * 전일총자산평가금액
       */
      bfdy_tot_asst_evlu_amt: string;

      /**
       * 자산증감액
       */
      asst_icdc_amt: string;

      /**
       * 자산증감수익율
       */
      asst_icdc_erng_rt: string;
    }>;

    /**
     * 요약 메시지
     */
    message: string;
  }> {
    this.logger.log(`=== 전체 포트폴리오 데이터 조회 요청 ===`);

    try {
      const result = await this.kisService.getPortfolioData(
        session.kisSessionData,
      );

      this.logger.log(`=== 전체 포트폴리오 데이터 조회 성공 ===`);
      this.logger.log(`보유 종목 수: ${result.output1.length}개`);
      this.logger.log(`총 평가금액: ${result.output2[0]?.tot_evlu_amt || '0'}원`);

      return result;
    } catch (error) {
      this.logger.error(`=== 전체 포트폴리오 데이터 조회 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      throw error;
    }
  }

  /**
   * 포트폴리오 요약 정보 조회 (PortfolioHeader용)
   *
   * @summary 포트폴리오 헤더용 간소화된 요약 정보 조회
   * @param session 세션 정보 (SessionGuard에서 검증된 세션)
   * @returns 포트폴리오 핵심 요약 데이터
   */
  @TypedRoute.Post("portfolio-summary")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  public async getPortfolioSummary(@Session() session: ISessionData): Promise<{
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
  }> {
    this.logger.log(`=== 포트폴리오 요약 정보 조회 요청 ===`);

    try {
      const result = await this.kisService.getPortfolioSummary(
        session.kisSessionData,
      );

      this.logger.log(`=== 포트폴리오 요약 정보 조회 성공 ===`);
      this.logger.log(`보유 종목 수: ${result.stockCount}개`);
      this.logger.log(`총 평가금액: ${result.totalValue.toLocaleString()}원`);
      this.logger.log(`평가손익: ${result.changeAmount.toLocaleString()}원 (${result.changePercent}%)`);

      return result;
    } catch (error) {
      this.logger.error(`=== 포트폴리오 요약 정보 조회 실패 ===`);
      this.logger.error(
        `오류: ${error instanceof Error ? error.message : String(error)}`,
      );

      throw error;
    }
  }

  /**
   * 계좌 번호에 해당하는 계좌 타입을 결정합니다.
   */
  private determineAccountType(accountNumber: string): "REAL" | "VIRTUAL" {
    // TODO: 실전 확장시 계좌번호 패턴에 따라 결정 로직 구현
    return "VIRTUAL";
  }

  /**
   * 에러 정보를 기반으로 상세 에러 정보를 구성합니다.
   */
  private buildErrorDetails(error: any): IKisAuthResponseDto["errorDetails"] {
    const errorDetails: NonNullable<IKisAuthResponseDto["errorDetails"]> = {
      retryable: false,
    };

    // KIS API 응답에서 에러 정보 추출 (실제 에러 구조에 따라 수정 필요)
    if (error?.response?.data) {
      const kisError = error.response.data;
      errorDetails.kisErrorCode = kisError.error_code || kisError.rt_cd;
      errorDetails.kisErrorMessage =
        kisError.error_description || kisError.msg1;
    }

    // 재시도 가능한 에러 유형 판단
    if (
      error?.code === "NETWORK_ERROR" ||
      error?.response?.status >= 500 ||
      error?.message?.includes("timeout")
    ) {
      errorDetails.retryable = true;
    }

    return errorDetails;
  }
}
