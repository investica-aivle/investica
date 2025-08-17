import { IAgenticaRpcListener } from "@agentica/rpc";
import type { NewsPushPayload } from "./news";

export interface StockInfo {
  code: string;           // 종목코드 (6자리)
  name: string;          // 종목명 (한글)
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX'; // 시장구분
}

export interface IClientEvents extends IAgenticaRpcListener {
  onNews(payload: NewsPushPayload): Promise<void> | void;
  onStockFocus(payload: StockInfo): Promise<void> | void;
}