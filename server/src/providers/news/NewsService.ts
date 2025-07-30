import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class NewsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async fetchNewsSummaryAndSentiment(company: string) {
    const encodedCompany = encodeURIComponent(company);
    const naverUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodedCompany}&display=5`;

    const { data } = await this.httpService.axiosRef.get(naverUrl, {
      headers: {
        'X-Naver-Client-Id': this.configService.get('NAVER_CLIENT_ID'),
        'X-Naver-Client-Secret': this.configService.get('NAVER_CLIENT_SECRET'),
      },
    });

    const openai = new OpenAI({ apiKey: this.configService.get('OPENAI_API_KEY') });

    const items = await Promise.all(
      data.items.map(async (item: any) => {
        const prompt = `
다음 뉴스 내용을 간결하게 요약하고, 뉴스의 전반적인 감성(긍정/부정)을 판단해줘.
뉴스 내용: ${item.description}
결과 형식:
요약: ...
감성: 긍정 또는 부정
        `.trim();

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
        });

        const output = completion.choices[0].message.content ?? '';
        const [summaryLine, sentimentLine] = output.split('\n').map((line) => line.replace(/^.*?:\s*/, ''));

        return {
          title: item.title.replace(/<[^>]*>/g, ''),
          pubDate: item.pubDate,
          summary: summaryLine,
          sentiment: sentimentLine,
        };
      }),
    );

    return items;
  }
}
