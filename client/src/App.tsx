import { useState } from "react";
import { Chat } from "./components/chat/Chat";
import Header from "./components/Layout/Header";
import { SideContainer } from "./components/Layout/SideContainer";
import { AgenticaRpcProvider } from "./provider/AgenticaRpcProvider";
import { AppInitializer } from "./components/auth/AppInitializer";
import { LoginForm } from "./components/auth/LoginForm";
import { useAppSelector, selectIsAuthenticated, selectIsLoading } from "./store/hooks";

function App() {
  const [showSideContainer, setShowSideContainer] = useState(true);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <AppInitializer>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-slate-900 to-neutral-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">인증 확인 중...</p>
          </div>
        </div>
      </AppInitializer>
    );
  }

  // 인증되지 않은 경우 로그인 폼 표시
  if (!isAuthenticated) {
    return (
      <AppInitializer>
        <LoginForm />
      </AppInitializer>
    );
  }

  // 인증된 경우 메인 앱 표시
  return (
    <AgenticaRpcProvider>
      <AppInitializer>
        <div className="relative min-h-screen">
          {/* Shared Background */}
          <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-slate-900 to-neutral-900" />
          <div className="fixed inset-0 opacity-[0.07] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Content */}
          <div className="relative w-full min-h-screen flex flex-col">
            <Header setShowSideContainer={setShowSideContainer} />
            <div className="flex flex-1">
              {showSideContainer &&
                <div className="hidden lg:flex md:flex-1">
                  <SideContainer setShowSideContainer={setShowSideContainer} />
                </div>
              }
                <Chat />
            </div>
          </div>
        </div>
      </AppInitializer>
    </AgenticaRpcProvider>
  );
}

export default App;
