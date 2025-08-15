import { tags } from "typia";

/**
 * KIS OAuth 인증 요청 DTO
 */
export interface IKisAuthRequestDto {
  /**
   * 계좌번호
   * @example "12345678-01"
   */
  accountNumber: string & tags.Pattern<"^[0-9]{8}-[0-9]{2}$">;

  /**
   * KIS App Key
   * @example "PSABCDef1234567890abcdef"
   */
  appKey: string & tags.MinLength<20>;

  /**
   * KIS App Secret
   * @example "xyz123ABC456DEF789ghi012JKL345mno678PQR901stu234VWX567="
   */
  appSecret: string & tags.MinLength<40>;
}

/**
 * KIS OAuth 인증 응답 DTO
 */
export interface IKisAuthResponseDto {
  /**
   * 인증 성공 여부
   */
  success: boolean;

  /**
   * 세션 키 (성공 시)
   */
  sessionKey?: string;

  /**
   * 마스킹된 계좌번호 (성공 시)
   */
  maskedAccountNumber?: string;

  /**
   * 세션 만료 시간 (성공 시)
   * @format date-time
   */
  expiresAt?: string;

  /**
   * 세션 생성 시간 (성공 시)
   * @format date-time
   */
  createdAt?: string;

  /**
   * 액세스 토큰 만료까지 남은 시간 (초 단위)
   */
  expiresInSeconds?: number;

  /**
   * 계좌 타입 (실전/모의)
   */
  accountType?: "REAL" | "VIRTUAL";

  /**
   * 에러 메시지 (실패 시)
   */
  error?: string;

  /**
   * 에러 코드 (실패 시)
   */
  errorCode?: string;

  /**
   * 상세 에러 정보 (실패 시)
   */
  errorDetails?: {
    /**
     * KIS API 에러 코드
     */
    kisErrorCode?: string;

    /**
     * KIS API 에러 메시지
     */
    kisErrorMessage?: string;

    /**
     * 재시도 권장 여부
     */
    retryable?: boolean;
  };
}
