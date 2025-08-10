import { useState } from "react";
import { Chat } from "./components/chat/Chat";
import Header from "./components/Layout/Header";
import { SideContainer } from "./components/Layout/SideContainer";
import { AgenticaRpcProvider } from "./provider/AgenticaRpcProvider";

function App() {

  const [showSideContainer, setShowSideContainer] = useState(false);

  return (
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
          <AgenticaRpcProvider>
            <Chat />
          </AgenticaRpcProvider>
        </div>
      </div>
    </div>
  );
}

export default App;
