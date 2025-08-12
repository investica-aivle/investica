import { NewsService } from "./NewsService";

export class NewsAgentService {
  constructor(private readonly newsService: NewsService) {}

  public async getNewsSummary(input: { company: string }) {
    const summary = await this.newsService.fetchNewsSummaryAndSentiment(input.company);
    return {
      message: `${input.company} 관련 뉴스 요약입니다.`,
      data: summary,
    };
  }
}
