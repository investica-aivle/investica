interface ChatStatusProps {
  isError: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  hasMessages: boolean;
  isWsUrlConfigured: boolean;
}

export function ChatStatus({
  isError,
  isConnected,
  isConnecting,
  hasMessages,
  isWsUrlConfigured
}: ChatStatusProps) {
  if (!isWsUrlConfigured) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="text-yellow-400 text-sm">
          VITE_AGENTICA_WS_URL is not configured
        </div>
        <div className="text-gray-400 text-sm">
          Please set the VITE_AGENTICA_WS_URL environment variable
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-sm">
          채팅 서버 연결에 실패했습니다
        </div>
        <div className="text-gray-400 text-xs">
          세션이 만료되었거나 서버에 문제가 있을 수 있습니다
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-blue-400 text-sm">채팅 서버에 연결 중...</div>
        </div>
        <div className="text-gray-400 text-xs">
          세션키로 인증하고 있습니다
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        연결 대기 중...
      </div>
    );
  }

  if (!hasMessages) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l2.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-white text-lg font-medium mb-2">AI 투자 상담 시작</h3>
          <p className="text-gray-400 text-sm max-w-md">
              환영합니다! 당신의 현명한 투자를 위한 스마트 파트너, Investica가 함께합니다.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
