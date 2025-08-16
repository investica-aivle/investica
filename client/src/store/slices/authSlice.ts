import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthResponse } from '../../types/auth';

const initialState: AuthState = {
  // 인증 상태
  isAuthenticated: false,
  isLoading: false,

  // 세션 정보
  sessionKey: null,
  maskedAccountNumber: null,
  accountType: null,
  expiresAt: null,
  createdAt: null,
  expiresInSeconds: null,
  availableFeatures: [],

  // 에러 처리
  error: null,
  errorCode: null,
  errorDetails: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 로그인 시작
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.errorCode = null;
      state.errorDetails = null;
    },

    // 로그인 성공
    loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
      const {
        sessionKey,
        maskedAccountNumber,
        accountType,
        expiresAt,
        createdAt,
        expiresInSeconds,
        availableFeatures
      } = action.payload;

      state.isLoading = false;
      state.isAuthenticated = true;
      state.sessionKey = sessionKey || null;
      state.maskedAccountNumber = maskedAccountNumber || null;
      state.accountType = accountType || null;
      state.expiresAt = expiresAt || null;
      state.createdAt = createdAt || null;
      state.expiresInSeconds = expiresInSeconds || null;
      state.availableFeatures = availableFeatures || [];
      state.error = null;
      state.errorCode = null;
      state.errorDetails = null;
    },

    // 로그인 실패
    loginFailure: (state, action: PayloadAction<{ error: string; errorCode?: string; errorDetails?: AuthResponse['errorDetails'] }>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.error = action.payload.error;
      state.errorCode = action.payload.errorCode || null;
      state.errorDetails = action.payload.errorDetails || null;
    },

    // 로그아웃
    logout: (state) => {
      return initialState;
    },

    // 에러 클리어
    clearError: (state) => {
      state.error = null;
      state.errorCode = null;
      state.errorDetails = null;
    },

    // 저장된 세션 복원
    restoreSession: (state, action: PayloadAction<AuthState>) => {
      const savedState = action.payload;

      // 세션이 만료되지 않았는지 확인
      if (savedState.expiresAt) {
        const now = new Date();
        const expiryDate = new Date(savedState.expiresAt);

        if (now < expiryDate) {
          // 유효한 세션이므로 복원
          Object.assign(state, savedState);
        }
      }
    }
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  restoreSession,
} = authSlice.actions;

export default authSlice.reducer;
