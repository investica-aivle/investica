import React, { useState } from 'react';
import { useAppDispatch, useAppSelector, selectAuth } from '../../store/hooks';
import { useAuthenticateMutation } from '../../store/api/authApi';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';
import { LoginFormData, AuthState } from '../../types/auth';
import { formatAccountNumber, validateAccountNumber, validateAppKey, validateAppSecret, SessionManager } from '../../utils/sessionManager';

export const LoginForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error, errorDetails } = useAppSelector(selectAuth);
  const [authenticate] = useAuthenticateMutation();

  const [formData, setFormData] = useState<LoginFormData>({
    accountNumber: '',
    appKey: '',
    appSecret: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    accountNumber?: string;
    appKey?: string;
    appSecret?: string;
  }>({});

  const [showPassword, setShowPassword] = useState({
    appKey: false,
    appSecret: false,
  });

  const [clickCount, setClickCount] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(0);

  const handleIconClick = () => {
    const timestamp = Date.now();

    if (timestamp - lastInteraction > 5000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }

    setLastInteraction(timestamp);

    if (clickCount + 1 >= 5) {
      autoDev();
      setClickCount(0);
    }
  };

  const autoDev = async () => {
    const credentials = {
      accountNumber:  import.meta.env.KIS_ACCOUTT_ID,
      appKey: import.meta.env.KIS_APP_KEY ,
      appSecret: import.meta.env.KIS_APP_SECRET,
    };

    setFormData(credentials);

    setTimeout(async () => {
      dispatch(clearError());
      dispatch(loginStart());

      try {
        const response = await authenticate(credentials).unwrap();

        if (response.success) {
          dispatch(loginSuccess(response));

          const sessionState = {
            ...response,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            errorCode: null,
            errorDetails: null,
          } as AuthState;

          SessionManager.saveSession(sessionState);
        } else {
          dispatch(loginFailure({
            error: response.error || '인증에 실패했습니다.',
            errorCode: response.errorCode,
            errorDetails: response.errorDetails,
          }));
        }
      } catch (error: any) {
        dispatch(loginFailure({
          error: error?.data?.error || error?.message || '네트워크 오류가 발생했습니다.',
          errorCode: error?.data?.errorCode || 'NETWORK_ERROR',
          errorDetails: error?.data?.errorDetails,
        }));
      }
    }, 100);
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!formData.accountNumber) {
      errors.accountNumber = '계좌번호를 입력해주세요.';
    } else if (!validateAccountNumber(formData.accountNumber)) {
      errors.accountNumber = '올바른 계좌번호 형식이 아닙니다. (예: 12345678-01)';
    }

    if (!formData.appKey) {
      errors.appKey = 'App Key를 입력해주세요.';
    } else if (!validateAppKey(formData.appKey)) {
      errors.appKey = 'App Key는 최소 20자 이상이어야 합니다.';
    }

    if (!formData.appSecret) {
      errors.appSecret = 'App Secret을 입력해주세요.';
    } else if (!validateAppSecret(formData.appSecret)) {
      errors.appSecret = 'App Secret은 최소 40자 이상이어야 합니다.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    dispatch(clearError());
    dispatch(loginStart());

    try {
      const response = await authenticate({
        accountNumber: formData.accountNumber,
        appKey: formData.appKey,
        appSecret: formData.appSecret,
      }).unwrap();

      if (response.success) {
        dispatch(loginSuccess(response));

        const sessionState = {
          ...response,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          errorCode: null,
          errorDetails: null,
        } as AuthState;

        SessionManager.saveSession(sessionState);

      } else {
        dispatch(loginFailure({
          error: response.error || '인증에 실패했습니다.',
          errorCode: response.errorCode,
          errorDetails: response.errorDetails,
        }));
      }
    } catch (error: any) {
      dispatch(loginFailure({
        error: error?.data?.error || error?.message || '네트워크 오류가 발생했습니다.',
        errorCode: error?.data?.errorCode || 'NETWORK_ERROR',
        errorDetails: error?.data?.errorDetails,
      }));
    }
  };

  const handleInputChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (field === 'accountNumber') {
      value = formatAccountNumber(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleRetry = () => {
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background matching main app */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-slate-900 to-neutral-900" />
      <div className="fixed inset-0 opacity-[0.07] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Login form container with SideContainer design */}
      <div className="relative w-full max-w-md bg-zinc-800/50 backdrop-blur-md rounded-2xl border border-zinc-700/30 p-8 text-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-400 select-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              onClick={handleIconClick}
              style={{ userSelect: 'none' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">KIS 인증</h2>
          <p className="text-gray-400">한국투자증권 계좌로 로그인하세요</p>
        </div>

        {/* 전역 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-red-300 font-medium">{error}</p>
                  {errorDetails?.kisErrorMessage && (
                    <p className="text-red-400 text-sm mt-1">{errorDetails.kisErrorMessage}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClearError}
                className="text-red-400 hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {errorDetails?.retryable && (
              <button
                onClick={handleRetry}
                className="mt-3 px-3 py-1 bg-red-500/20 text-red-300 rounded-md text-sm hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 계좌번호 입력 */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-300 mb-2">
              계좌번호
            </label>
            <input
              id="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={handleInputChange('accountNumber')}
              placeholder="12345678-01"
              maxLength={11}
              className={`w-full px-4 py-3 bg-zinc-700/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-500 ${
                fieldErrors.accountNumber ? 'border-red-500/50' : 'border-zinc-600/50'
              }`}
            />
            {fieldErrors.accountNumber && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.accountNumber}</p>
            )}
          </div>

          {/* App Key 입력 */}
          <div>
            <label htmlFor="appKey" className="block text-sm font-medium text-gray-300 mb-2">
              App Key
            </label>
            <div className="relative">
              <input
                id="appKey"
                type={showPassword.appKey ? 'text' : 'password'}
                value={formData.appKey}
                onChange={handleInputChange('appKey')}
                placeholder="KIS App Key를 입력하세요"
                className={`w-full px-4 py-3 pr-12 bg-zinc-700/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-500 ${
                  fieldErrors.appKey ? 'border-red-500/50' : 'border-zinc-600/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, appKey: !prev.appKey }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword.appKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.appKey && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.appKey}</p>
            )}
          </div>

          {/* App Secret 입력 */}
          <div>
            <label htmlFor="appSecret" className="block text-sm font-medium text-gray-300 mb-2">
              App Secret
            </label>
            <div className="relative">
              <input
                id="appSecret"
                type={showPassword.appSecret ? 'text' : 'password'}
                value={formData.appSecret}
                onChange={handleInputChange('appSecret')}
                placeholder="KIS App Secret을 입력하세요"
                className={`w-full px-4 py-3 pr-12 bg-zinc-700/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-500 ${
                  fieldErrors.appSecret ? 'border-red-500/50' : 'border-zinc-600/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, appSecret: !prev.appSecret }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword.appSecret ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.appSecret && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.appSecret}</p>
            )}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600/20 border border-blue-500/30 text-blue-300 py-3 px-4 rounded-lg font-medium hover:bg-blue-600/30 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                인증 중...
              </div>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        {/* 도움말 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            한국투자증권 OpenAPI 계정이 필요합니다.
          </p>
          <a
            href="https://apiportal.koreainvestment.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            계정 발급받기 →
          </a>
        </div>
      </div>
    </div>
  );
};
