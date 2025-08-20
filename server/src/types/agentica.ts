import { IAgenticaRpcListener } from "@agentica/rpc";
import { StockInfo } from "./stock.types";

export interface NewsItem {
  title: string;
  pubDate: string;
  summary: string;
  sentiment: string;
  originalLink?: string;
}

export interface NewsPushPayload {
  company: string;
  items: NewsItem[];
  fetchedAt: string; // ISO
}

export interface TradingConfirmationRequest {
  id: string;
  type: 'buy' | 'sell';
  stockInfo: StockInfo;
  quantity: number;
  orderCondition: 'market' | 'limit';
  price?: number;
  estimatedAmount?: number;
}

export interface TradingConfirmationResponse {
  id: string;
  confirmed: boolean;
}

export interface IClientEvents extends IAgenticaRpcListener {
  onNews(payload: NewsPushPayload): Promise<void> | void;
  onStockFocus(payload: StockInfo): Promise<void> | void;
  onTradingConfirmationRequest(payload: TradingConfirmationRequest): Promise<TradingConfirmationResponse>;
}