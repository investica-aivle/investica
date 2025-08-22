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

  /**
   * 기업명으로 최근 뉴스 요약 및 감성 분석 수행
   * 
   * 네이버 뉴스 API를 통해 최신 뉴스를 크롤링하고,
   * 각 뉴스에 대해 ChatGPT API를 활용하여 요약 및 감성 분석을 진행합니다.
   * 
   * @param company 기업명 (예: 삼성전자)
   * @returns 뉴스 제목, 날짜, 요약 및 감성 정보 배열
   * @example
   * [
   *   {
   *     title: '삼성전자, 신제품 출시',
   *     pubDate: 'Wed, 07 Aug 2025 10:00:00 +0900',
   *     summary: '삼성전자가 새로운 스마트폰을 출시했다.',
   *     sentiment: '긍정',
   *     originalLink: 뉴스 원문url
   *   }
   * ]
   */

  private stripHtml(input: string) {
    return (input ?? '').replace(/<[^>]*>/g, '').trim();
  }
  private toHttps(url?: string) {
    if (!url) return url;
    try {
      const u = new URL(url);
      if (u.protocol === 'http:') u.protocol = 'https:';
      return u.toString();
    } catch {
      return url;
    }
  }

  public async fetchNewsSummaryAndSentiment(company: string) {
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
뉴스 내용: ${this.stripHtml(item.description)}
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

        const rawLink: string | undefined = item.originallink || item.link;
        const originalLink = this.toHttps(rawLink);

        return {
          title: item.title.replace(/<[^>]*>/g, ''),
          pubDate: item.pubDate,
          summary: summaryLine,
          sentiment: sentimentLine,
          originalLink,
        };
      }),
    );

    return items;
  }
}