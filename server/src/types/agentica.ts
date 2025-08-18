import { IAgenticaRpcListener } from "@agentica/rpc";

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

export interface IClientEvents extends IAgenticaRpcListener {
  onNews(payload: NewsPushPayload): Promise<void> | void;
}