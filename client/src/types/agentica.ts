import { IAgenticaRpcListener } from "@agentica/rpc";
import type { NewsPushPayload } from "./news";

export interface IClientEvents extends IAgenticaRpcListener {
  onNews(payload: NewsPushPayload): Promise<void> | void;
}