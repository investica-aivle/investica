// providers/news/NewsAgentService.ts
import { NewsService } from "./NewsService";
import type { IClientEvents, NewsPushPayload } from "../../types/agentica";

export class NewsAgentService {
  constructor(
    private readonly newsService: NewsService,
    private readonly listener: IClientEvents,  
  ) {}

  public async getNewsSummary(input: { company: string }) {
    const items = await this.newsService.fetchNewsSummaryAndSentiment(input.company);

    const payload: NewsPushPayload = {
      company: input.company,
      items,
      fetchedAt: new Date().toISOString(),
    };
    await this.listener.onNews(payload);

    return {
      message: `${input.company} 관련 뉴스 요약 ${items.length}건을 보냈어요. 사이드바에서 확인하세요.`,
      data: items,
    };
  }
}
