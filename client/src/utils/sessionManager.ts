import { AuthState } from '../types/auth';

const SESSION_STORAGE_KEY = 'kis_auth_session';

export class SessionManager {
  // 세션 저장 (항상 sessionStorage에 저장)
  static saveSession(authState: AuthState) {
    const sessionData = {
      sessionKey: authState.sessionKey,
      maskedAccountNumber: authState.maskedAccountNumber,
      accountType: authState.accountType,
      expiresAt: authState.expiresAt,
      createdAt: authState.createdAt,
      expiresInSeconds: authState.expiresInSeconds,
      availableFeatures: authState.availableFeatures,
      isAuthenticated: authState.isAuthenticated,
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }

  // 세션 복원
  static restoreSession(): AuthState | null {
    try {
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);

      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);

      // 세션 만료 확인
      if (parsed.expiresAt && new Date() >= new Date(parsed.expiresAt)) {
        this.clearSession();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('세션 복원 실패:', error);
      this.clearSession();
      return null;
    }
  }

  // 세션 클리어
  static clearSession() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// 계좌번호 포맷팅 유틸리티
export const formatAccountNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/\D/g, '');

  // 8자리까지만 허용하고 하이픈 추가
  if (numbers.length <= 8) {
    return numbers;
  } else {
    return `${numbers.slice(0, 8)}-${numbers.slice(8, 10)}`;
  }
};

// 계좌번호 유효성 검사
export const validateAccountNumber = (accountNumber: string): boolean => {
  const pattern = /^[0-9]{8}-[0-9]{2}$/;
  return pattern.test(accountNumber);
};

// API 키 유효성 검사
export const validateAppKey = (appKey: string): boolean => {
  return appKey.length >= 20;
};

export const validateAppSecret = (appSecret: string): boolean => {
  return appSecret.length >= 40;
};
