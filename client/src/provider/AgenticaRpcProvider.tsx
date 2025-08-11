import { IAgenticaEventJson } from "@agentica/core";
import { IAgenticaRpcListener, IAgenticaRpcService } from "@agentica/rpc";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState
} from "react";
import { Driver, WebSocketConnector } from "tgrid";
import { IClientEvents } from "../types/agentica";
import { NewsItem, NewsPushPayload } from "../types/news";

export interface IKisAuthData {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}

/**
 * KIS 세션 데이터를 포함한 Agentica RPC 서비스 인터페이스 (클라이언트용)
 */
export interface IAgenticaKisRpcService extends IAgenticaRpcService<"chatgpt"> {
  kisSessionData?: {
    accountNumber: string;
    appKey: string;
    appSecret: string;
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  };
}

interface AgenticaRpcContextType {
  messages: IAgenticaEventJson[];
  conversate: (message: string) => Promise<void>;
  isConnected: boolean;
  isError: boolean;
  authError: string | null;
  isAuthenticating: boolean;
  tryConnect: (authData: IKisAuthData) => Promise<
    | WebSocketConnector<
        IKisAuthData,
        IClientEvents,
        IAgenticaKisRpcService
      >
    | undefined
  >;

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
  const [driver, setDriver] =
    useState<Driver<IAgenticaKisRpcService, false>>();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [newsCompany, setNewsCompany] = useState("");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsFetchedAt, setNewsFetchedAt] = useState<string | null>(null);
  const [hasFirstPush, setHasFirstPush] = useState(false);

  const pushMessage = useCallback(
    async (message: IAgenticaEventJson) =>
      setMessages((prev) => [...prev, message]),
    []
  );

  const tryConnect = useCallback(
    async (authData: IKisAuthData) => {
      try {
        setIsError(false);
        setAuthError(null);
        setIsAuthenticating(true);
        const connector: WebSocketConnector<
          IKisAuthData,
          IClientEvents,
          IAgenticaKisRpcService
        > = new WebSocketConnector<
          IKisAuthData,
          IClientEvents,
          IAgenticaKisRpcService
        >(authData, {
          assistantMessage: pushMessage,
          describe: pushMessage,
          userMessage: pushMessage,

          onNews: (payload: NewsPushPayload) => {
            setNewsCompany(payload.company);
            setNewsItems(payload.items ?? []);
            setNewsFetchedAt(payload.fetchedAt);
            setHasFirstPush(true);
          },
        });
        await connector.connect(import.meta.env.VITE_AGENTICA_WS_URL);
        const driver = connector.getDriver();
        setDriver(driver);
        return connector;
      } catch (e) {
        console.error(e);
        setIsError(true);
        if (e instanceof Error) {
          setAuthError(e.message);
        } else {
          setAuthError("KIS 계좌 인증에 실패했습니다. 계좌번호, App Key, App Secret을 확인해주세요.");
        }
      } finally {
        setIsAuthenticating(false);
      }
    },
    [pushMessage]
  );

  const conversate = useCallback(
    async (message: string) => {
      if (!driver) {
        console.error("Driver is not connected. Please connect to the server.");
        return;
      }
      try {
        await driver.conversate(message);
      } catch (e) {
        console.error(e);
        setIsError(true);
      }
    },
    [driver]
  );

  // 자동 연결 제거 - 사용자가 수동으로 인증 정보를 입력해야 함
  // useEffect(() => {
  //   (async () => {
  //     const connector = await tryConnect();
  //     return () => {
  //       connector?.close();
  //       setDriver(undefined);
  //     };
  //   })();
  // }, [tryConnect]);

  const isConnected = !!driver;

  return (
    <AgenticaRpcContext.Provider
      value={{
        messages,
        conversate,
        isConnected,
        isError,
        authError,
        isAuthenticating,
        tryConnect,
        news: {
          company: newsCompany,
          items: newsItems,
          fetchedAt: newsFetchedAt,
          hasFirstPush,
        },
      }}
    >
      {children}
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
