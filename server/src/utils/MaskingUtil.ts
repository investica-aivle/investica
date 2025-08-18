/**
 * 마스킹 관련 유틸리티 함수들
 */
export class MaskingUtil {
  /**
   * 계좌번호를 마스킹 처리합니다.
   * @param accountNumber 원본 계좌번호 (예: "12345678-01")
   * @returns 마스킹된 계좌번호 (예: "1234****01")
   */
  public static maskAccountNumber(accountNumber: string): string {
    return accountNumber.replace(/(\d{4})\d+(\d{2})/, "$1****$2");
  }

  /**
   * App Key를 마스킹 처리합니다.
   * @param appKey 원본 App Key
   * @returns 마스킹된 App Key (앞 8자리 + ***)
   */
  public static maskAppKey(appKey: string): string {
    return appKey.substring(0, 8) + "***";
  }

  /**
   * App Secret을 마스킹 처리합니다.
   * @param appSecret 원본 App Secret
   * @returns 마스킹된 App Secret (앞 8자리 + ***)
   */
  public static maskAppSecret(appSecret: string): string {
    return appSecret.substring(0, 8) + "***";
  }

  /**
   * 세션 키를 마스킹 처리합니다.
   * @param sessionKey 원본 세션 키
   * @returns 마스킹된 세션 키 (앞 8자리 + ...)
   */
  public static maskSessionKey(sessionKey: string): string {
    return sessionKey.substring(0, 8) + "...";
  }
}
