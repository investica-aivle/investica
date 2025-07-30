import { Controller, Post, Body } from '@nestjs/common';
import { NewsService } from '../../providers/news/NewsService';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
getNews(@Body() body: { company: string }) {
  return this.newsService.fetchNewsSummaryAndSentiment(body.company);
}

}
