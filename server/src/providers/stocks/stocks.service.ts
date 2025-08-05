import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { labelMap } from '../../common/labelMap';

interface StockRequestDto {
  company: string;
  accessToken: string;
  appKey: string;
  appSecret: string;
}

const iscdStatClsCodeMap: Record<string, string> = {
  '51': '관리종목',
  '52': '투자위험',
  '53': '투자경고',
  '54': '투자주의',
  '55': '신용가능',
  '57': '증거금 100%',
  '58': '거래정지',
  '59': '단기과열종목',
};

@Injectable()
export class StocksService {
  private readonly KIS_BASE_URL = 'https://openapivts.koreainvestment.com:29443';
  private readonly openai: OpenAI;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow('OPENAI_API_KEY'),
    });
  }

  async fetchStockPrice(body: StockRequestDto) {
    const { company, accessToken, appKey, appSecret } = body;

    const prompt = `${company}의 한국 증권 종목코드를 숫자 6자리로 알려줘.`;
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const stockCode = completion.choices[0].message.content?.match(/\d{6}/)?.[0];
    if (!stockCode) {
      throw new HttpException('종목코드 인식 실패', HttpStatus.BAD_REQUEST);
    }

    try {
      const url = `${this.KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`;
      const { data } = await this.http.axiosRef.get(url, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          authorization: `Bearer ${accessToken}`,
          appkey: appKey,
          appsecret: appSecret,
          tr_id: 'FHKST01010100',
          custtype: 'P',
        },
        params: {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: stockCode.trim(),
        },
      });

      if (data.rt_cd !== '0') {
        throw new HttpException(data.msg1 || '시세 조회 실패', HttpStatus.BAD_GATEWAY);
      }

      const output = data.output;
      const result: Record<string, any> = {};

      for (const [key, value] of Object.entries(output)) {
        const label = labelMap[key] || key;

        // 종목 상태 구분 코드 해석
        if (key === 'iscd_stat_cls_code') {
          result[label] = iscdStatClsCodeMap[String(value)] || value;
        } else {
          result[label] = value;
        }
      }

      return result;
    } catch (error: any) {
      console.error('KIS 시세 요청 실패:', error.response?.data || error);
      throw new HttpException('한국투자증권 API 호출 실패', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}