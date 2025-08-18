import axios from 'axios';
import { SessionManager } from '../utils/sessionManager';

// API Base URL 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (세션 키 자동 추가)
apiClient.interceptors.request.use(
  (config) => {
    // 세션에서 sessionKey 가져오기
    const session = SessionManager.restoreSession();
    if (session?.sessionKey) {
      config.headers.Authorization = `Bearer ${session.sessionKey}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리 등)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 에러 처리 로직
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
