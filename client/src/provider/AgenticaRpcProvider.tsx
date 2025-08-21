import { IAgenticaEventJson } from "@agentica/core";
import { IAgenticaRpcService } from "@agentica/rpc";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { Driver, WebSocketConnector } from "tgrid";
import { OrderConfirmation } from "../components/trading/OrderConfirmation";
import tabs, { TabDetail, TabType } from "../constant/tabs";
import { selectSessionKey, useAppDispatch, useAppSelector } from "../store/hooks";
import { setTargetStock } from "../store/slices/tradingSlice";
import { IClientEvents, StockInfo, TradingConfirmationRequest, TradingConfirmationResponse } from "../types/agentica";
import { NewsItem, NewsPushPayload } from "../types/news";

export interface IWebSocketHeaders {
  sessionKey: string;
}

interface AgenticaRpcContextType {
  messages: IAgenticaEventJson[];
  conversate: (message: string) => Promise<void>;
  isConnected: boolean;
  isError: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  news: {
    company: string;
    items: NewsItem[];
    fetchedAt: string | null;
    hasFirstPush: boolean;
  };
}

const AgenticaRpcContext = createContext<AgenticaRpcContextType | null>(null);

export function AgenticaRpcProvider({ children }: PropsWithChildren) {
  const [messages, setMessages] = useState<IAgenticaEventJson[]>([]);
  const [isError, setIsError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [driver, setDriver] = useState<Driver<IAgenticaRpcService<"chatgpt">, false>>();
  const [currentTab, setCurrentTab] = useState<TabType>(TabType.PORTFOLIO);

  const sessionKey = useAppSelector(selectSessionKey);
  const dispatch = useAppDispatch();

  const [newsCompany, setNewsCompany] = useState("");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsFetchedAt, setNewsFetchedAt] = useState<string | null>(null);
  const [hasFirstPush, setHasFirstPush] = useState(false);

  // Trading confirmation modal state
  const [confirmationRequest, setConfirmationRequest] = useState<TradingConfirmationRequest | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [pendingConfirmationResolve, setPendingConfirmationResolve] = useState<((response: TradingConfirmationResponse) => void) | null>(null);

  const pushMessage = useCallback(
    async (message: IAgenticaEventJson) =>
      setMessages((prev) => [...prev, message]),
    []
  );

  // Handle trading confirmation request - connectWithSessionKey보다 먼저 정의
  const handleTradingConfirmationRequest = useCallback(
    (request: TradingConfirmationRequest): Promise<TradingConfirmationResponse> => {
      return new Promise((resolve) => {
        setConfirmationRequest(request);
        setIsConfirmationModalOpen(true);
        setPendingConfirmationResolve(() => resolve);
      });
    },
    []
  );

  const connectWithSessionKey = useCallback(async (sessionKey: string) => {
    if (!sessionKey) return;

    try {
      setIsConnecting(true);
      setIsError(false);

      const connector: WebSocketConnector<
        IWebSocketHeaders,
        IClientEvents,
        IAgenticaRpcService<"chatgpt">
      > = new WebSocketConnector<
        IWebSocketHeaders,
        IClientEvents,
        IAgenticaRpcService<"chatgpt">
      >({ sessionKey }, {
        assistantMessage: pushMessage,
        userMessage: pushMessage,
        describe: async(evt: IAgenticaEventJson.IDescribe) => {
          setIsLoading(false);
          pushMessage(evt);
        },
        execute: async (evt: IAgenticaEventJson.IExecute) => {
          // arguments를 통해 인자를 받을 수 있음
          const functionName = evt?.operation?.function;
          if (functionName) {
            for (const [tabType, tabDetail] of Object.entries(tabs)) {
              if ((tabDetail as TabDetail).function.includes(functionName)) {
                setCurrentTab(tabType as TabType);
                break;
              }
            }
          }
        },
        onNews: (payload: NewsPushPayload) => {
          setNewsCompany(payload.company);
          setNewsItems(payload.items ?? []);
          setNewsFetchedAt(payload.fetchedAt);
          setHasFirstPush(true);
        },
        onStockFocus: (payload: StockInfo) => {
          dispatch(setTargetStock(payload));
        },
        onTradingConfirmationRequest: handleTradingConfirmationRequest
      });


      await connector.connect(import.meta.env.VITE_AGENTICA_WS_URL);
      const driver = connector.getDriver();
      setDriver(driver);

    } catch (e) {
      console.error('WebSocket 연결 실패:', e);
      setIsError(true);
    } finally {
      setIsConnecting(false);
    }
  }, [pushMessage, dispatch, handleTradingConfirmationRequest]);

  // 세션키가 있으면 자동으로 연결 시도
  useEffect(() => {
    if (sessionKey && !driver && !isConnecting) {
      connectWithSessionKey(sessionKey);
    }
  }, [sessionKey, driver, isConnecting, connectWithSessionKey]);

  const conversate = useCallback(
    async (message: string) => {
      setIsLoading(true);
      if (!driver) {
        console.error("Driver is not connected. Please connect to the server.");
        return;
      }
      try {
        await driver.conversate(message);
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        setIsError(true);
      }
    },
    [driver]
  );

  // Handle confirmation modal confirm
  const handleConfirmationConfirm = useCallback(() => {
    if (pendingConfirmationResolve && confirmationRequest) {
      const response = {
        id: confirmationRequest.id,
        confirmed: true
      };

      pendingConfirmationResolve(response);
      setIsConfirmationModalOpen(false);
      setConfirmationRequest(null);
      setPendingConfirmationResolve(null);
    }
  }, [pendingConfirmationResolve, confirmationRequest]);

  // Handle confirmation modal cancel
  const handleConfirmationCancel = useCallback(() => {
    if (pendingConfirmationResolve && confirmationRequest) {
      const response = {
        id: confirmationRequest.id,
        confirmed: false
      };

      pendingConfirmationResolve(response);
      setIsConfirmationModalOpen(false);
      setConfirmationRequest(null);
      setPendingConfirmationResolve(null);
    }
  }, [pendingConfirmationResolve, confirmationRequest]);

  const isConnected = !!driver;

  return (
    <AgenticaRpcContext.Provider
      value={{
        messages,
        conversate,
        isConnected,
        isError,
        isConnecting,
        isLoading,
        currentTab,
        setCurrentTab,
        news: {
          company: newsCompany,
          items: newsItems,
          fetchedAt: newsFetchedAt,
          hasFirstPush,
        },
      }}
    >
      {children}
      {isConfirmationModalOpen && confirmationRequest && (
        <OrderConfirmation
          isOpen={isConfirmationModalOpen}
          orderType={confirmationRequest.type}
          stockName={confirmationRequest.stockInfo.name}
          quantity={confirmationRequest.quantity.toString()}
          orderCondition={confirmationRequest.orderCondition}
          price={confirmationRequest.price?.toString()}
          confirmationRequest={confirmationRequest}
          onConfirm={handleConfirmationConfirm}
          onCancel={handleConfirmationCancel}
        />
      )}
    </AgenticaRpcContext.Provider>
  );
}

export function useAgenticaRpc() {
  const context = useContext(AgenticaRpcContext);
  if (!context) {
    throw new Error("useAgenticaRpc must be used within AgenticaRpcProvider");
  }
  return context;
}
