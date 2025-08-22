import { useEffect, useRef } from "react";
import { useAgenticaRpc } from "../../provider/AgenticaRpcProvider";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { ChatStatus } from "./ChatStatus";

export function Chat() {
  const {
    messages,
    conversate,
    isConnected,
    isLoading,
    isError,
    isConnecting,
  } = useAgenticaRpc();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasMessage = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  const isLastMessageFromUser = lastMessage?.type === "userMessage";

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    try {
      await conversate(content);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 h-full">
      <div className="flex-1 flex flex-col bg-zinc-800/50 backdrop-blur-md rounded-2xl overflow-hidden border border-zinc-700/30 h-full">
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#52525b #18181b'
            }}
          >
            {hasMessage && <ChatMessages messages={messages} />}
            <ChatStatus
              isError={isError}
              isConnected={isConnected}
              isLoading={isLoading}
              isConnecting={isConnecting}
              hasMessages={hasMessage}
              isWsUrlConfigured={import.meta.env.VITE_AGENTICA_WS_URL !== ""}
            />
          </div>
        </div>

          <div className="p-4 flex-shrink-0">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={!isConnected || isError || isLastMessageFromUser || isConnecting || isLoading}
            />
          </div>
    </div>
  );
}
