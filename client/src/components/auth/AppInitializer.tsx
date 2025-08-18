import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { restoreSession } from '../../store/slices/authSlice';
import { SessionManager } from '../../utils/sessionManager';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 앱 시작 시 저장된 세션 복원 시도
    const initializeApp = () => {
      try {
        const savedSession = SessionManager.restoreSession();

        if (savedSession) {
          console.log('저장된 세션을 발견했습니다. 복원을 시도합니다.');
          dispatch(restoreSession(savedSession));
        } else {
          console.log('저장된 세션이 없습니다.');
        }
      } catch (error) {
        console.error('세션 복원 중 오류 발생:', error);
        SessionManager.clearSession();
      }
    };

    initializeApp();
  }, [dispatch]);

  // 단순히 children을 렌더링하기만 함
  return <>{children}</>;
};
