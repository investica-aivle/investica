/**
 * 쿠키 관련 유틸리티 함수들
 */
export class CookieUtil {
  /**
   * 쿠키 문자열을 파싱하여 객체로 변환
   *
   * @param cookieString HTTP Cookie 헤더 문자열
   * @returns 파싱된 쿠키 객체
   *
   * @example
   * ```typescript
   * const cookies = CookieUtil.parse("sessionKey=abc123; userId=user1; theme=dark");
   * console.log(cookies.sessionKey); // "abc123"
   * console.log(cookies.userId); // "user1"
   * console.log(cookies.theme); // "dark"
   * ```
   */
  public static parse(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    if (!cookieString) {
      return cookies;
    }

    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    return cookies;
  }

  /**
   * 쿠키 객체를 문자열로 변환
   *
   * @param cookies 쿠키 객체
   * @returns 쿠키 문자열
   *
   * @example
   * ```typescript
   * const cookieString = CookieUtil.stringify({ sessionKey: "abc123", theme: "dark" });
   * console.log(cookieString); // "sessionKey=abc123; theme=dark"
   * ```
   */
  public static stringify(cookies: Record<string, string>): string {
    return Object.entries(cookies)
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('; ');
  }

  /**
   * 특정 쿠키 값을 추출
   *
   * @param cookieString HTTP Cookie 헤더 문자열
   * @param name 추출할 쿠키 이름
   * @returns 쿠키 값 (없으면 undefined)
   *
   * @example
   * ```typescript
   * const sessionKey = CookieUtil.get("sessionKey=abc123; userId=user1", "sessionKey");
   * console.log(sessionKey); // "abc123"
   * ```
   */
  public static get(cookieString: string, name: string): string | undefined {
    const cookies = this.parse(cookieString);
    return cookies[name];
  }
}
