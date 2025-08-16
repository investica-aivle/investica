import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller, HttpCode, HttpStatus, Logger, UseGuards } from "@nestjs/common";

import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";
import { SessionManager } from "../../providers/session/SessionManager";
import { MaskingUtil } from "../../utils/MaskingUtil";
import { IKisAuthRequestDto, IKisAuthResponseDto } from "./dto/KisAuthDto";
import { SessionGuard } from "../../guards/SessionGuard";
import { Session } from "../../decorators/session.decorators";
import { ISessionData } from "../../providers/session/SessionManager";

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
    const maskedAccountNumber = MaskingUtil.maskAccountNumber(body.accountNumber);

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
      this.logger.log(`액세스 토큰 만료시간: ${kisSessionData.expiresAt.toISOString()}`);

      // 세션 생성
      const { sessionKey } = this.sessionManager.createSession(kisSessionData);
      const createdAt = new Date();

      // 만료까지 남은 시간 계산 (초 단위)
      const expiresInSeconds = Math.floor((kisSessionData.expiresAt.getTime() - createdAt.getTime()) / 1000);

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
      this.logger.error(`오류: ${error instanceof Error ? error.message : String(error)}`);

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
    const maskedAccountNumber = MaskingUtil.maskAccountNumber(session.kisSessionData.accountNumber);

    this.logger.log(`=== 로그아웃 요청 시작 ===`);
    this.logger.log(`세션 키: ${maskedSessionKey}`);
    this.logger.log(`계좌번호: ${maskedAccountNumber}`);

    try {
      // 세션 제거
      const removed = this.sessionManager.removeSession(session.id);

      if (!removed) {
        this.logger.warn(`=== 세션 제거 실패 ===`);
        this.logger.warn(`세션이 이미 제거되었거나 존재하지 않음: ${session.id}`);
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
      this.logger.error(`오류: ${error instanceof Error ? error.message : String(error)}`);

      throw error;
    }
  }


  /**
   * 계좌번호로 계좌 타입을 결정합니다.
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
      errorDetails.kisErrorMessage = kisError.error_description || kisError.msg1;
    }

    // 재시도 가능한 에러 유형 판단
    if (error?.code === "NETWORK_ERROR" ||
        error?.response?.status >= 500 ||
        error?.message?.includes("timeout")) {
      errorDetails.retryable = true;
    }

    return errorDetails;
  }
}
