// 서버 API 요청/응답 타입
export interface AuthRequest {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}

export interface AuthResponse {
  success: boolean;
  sessionKey?: string;
  maskedAccountNumber?: string;
  expiresAt?: string;
  createdAt?: string;
  expiresInSeconds?: number;
  availableFeatures?: string[];
  accountType?: "REAL" | "VIRTUAL";
  error?: string;
  errorCode?: string;
  errorDetails?: {
    kisErrorCode?: string;
    kisErrorMessage?: string;
    retryable?: boolean;
  };
}

// Redux 상태 타입
export interface AuthState {
  // 인증 상태
  isAuthenticated: boolean;
  isLoading: boolean;

  // 세션 정보
  sessionKey: string | null;
  maskedAccountNumber: string | null;
  accountType: "REAL" | "VIRTUAL" | null;
  expiresAt: string | null;
  createdAt: string | null;
  expiresInSeconds: number | null;
  availableFeatures: string[];

  // 에러 처리
  error: string | null;
  errorCode: string | null;
  errorDetails: AuthResponse['errorDetails'] | null;
}

// 폼 데이터 타입
export interface LoginFormData {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}
