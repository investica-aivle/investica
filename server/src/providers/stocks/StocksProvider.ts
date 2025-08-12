import { IKisSessionData } from "@models/KisTrading";
import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import { labelMap } from "../../common/labelMap";

interface StockRequestDto {
  /**
   * 기업명 (예: 삼성전자)
   * @example "삼성전자"
   */
  company: string;

  /**
   * 조회 기간 구분 (D:일, W:주, M:월)
   * @example "D"
   */
  periodCode?: "D" | "W" | "M";

  /**
   * 수정주가 반영 여부 (0: 미반영, 1: 반영)
   * @example 1
   */
  adjustPrice?: 0 | 1;
}

const iscdStatClsCodeMap: Record<string, string> = {
  "51": "관리종목",
  "52": "투자위험",
  "53": "투자경고",
  "54": "투자주의",
  "55": "신용가능",
  "57": "증거금 100%",
  "58": "거래정지",
  "59": "단기과열종목",
};

const flngClsCodeMap: Record<string, string> = {
  "01": "권리락",
  "02": "배당락",
  "03": "분배락",
  "04": "권배락",
  "05": "중간(분기)배당락",
  "06": "권리중간배당락",
  "07": "권리분기배당락",
};

@Injectable()
export class StocksProvider {
  private readonly KIS_BASE_URL =
    "https://openapivts.koreainvestment.com:29443";
  private readonly openai: OpenAI;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow("OPENAI_API_KEY"),
    });
  }

  /**
   * 국내 주식 현재가 시세 조회
   * @param body 기업명 요청 DTO
   * @param session KIS 인증 세션
   * @returns 한글로 매핑된 시세 정보
   */
  public async fetchStockPrice(
    body: StockRequestDto,
    session: IKisSessionData,
  ) {
    const { company } = body;
    const { accessToken, appKey, appSecret } = session;

    const stockCode = await this.getStockCodeFromCompany(company);

    try {
      const url = `${this.KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`;
      const { data } = await this.http.axiosRef.get(url, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${accessToken}`,
          appkey: appKey,
          appsecret: appSecret,
          tr_id: "FHKST01010100",
          custtype: "P",
        },
        params: {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: stockCode.trim(),
        },
      });

      if (data.rt_cd !== "0") {
        throw new HttpException(
          data.msg1 || "시세 조회 실패",
          HttpStatus.BAD_GATEWAY,
        );
      }

      const output = data.output;
      const result: Record<string, any> = {};

      for (const [key, value] of Object.entries(output)) {
        const label = labelMap[key] || key;
        result[label] =
          key === "iscd_stat_cls_code"
            ? iscdStatClsCodeMap[String(value)] || value
            : value;
      }

      return result;
    } catch (error: any) {
      console.error("KIS 시세 요청 실패:", error.response?.data || error);
      throw new HttpException(
        "한국투자증권 API 호출 실패",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 국내 주식 체결 정보 조회
   * @param body 기업명 요청 DTO
   * @param session KIS 인증 세션
   * @returns 체결 정보 배열 (한글 키 포함)
   */
  public async fetchStockTrades(
    body: StockRequestDto,
    session: IKisSessionData,
  ) {
    const { company } = body;
    const { accessToken, appKey, appSecret } = session;

    const stockCode = await this.getStockCodeFromCompany(company);

    try {
      const url = `${this.KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-ccnl`;
      const { data } = await this.http.axiosRef.get(url, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${accessToken}`,
          appkey: appKey,
          appsecret: appSecret,
          tr_id: "FHKST01010300",
          custtype: "P",
        },
        params: {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: stockCode.trim(),
        },
      });

      if (data.rt_cd !== "0") {
        throw new HttpException(
          data.msg1 || "체결 정보 조회 실패",
          HttpStatus.BAD_GATEWAY,
        );
      }

      const result = data.output.map((item: Record<string, any>) => {
        const parsed: Record<string, any> = {};
        for (const [key, value] of Object.entries(item)) {
          const label = labelMap[key] || key;
          parsed[label] = value;
        }
        return parsed;
      });

      return result;
    } catch (error: any) {
      console.error("KIS 체결 요청 실패:", error.response?.data || error);
      throw new HttpException(
        "한국투자증권 API 호출 실패",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 국내 주식 일자별 가격 조회 (일/주/월별)
   * @param body 기업명, 기간구분, 수정주가 여부 DTO
   * @param session KIS 인증 세션
   * @returns 일자별 가격 데이터 배열 (한글 키 포함)
   */
  public async fetchStockDailyPrices(
    body: StockRequestDto,
    session: IKisSessionData,
  ) {
    const { company, periodCode = "D", adjustPrice = 1 } = body;
    const { accessToken, appKey, appSecret } = session;

    const stockCode = await this.getStockCodeFromCompany(company);

    try {
      const url = `${this.KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-price`;
      const { data } = await this.http.axiosRef.get(url, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${accessToken}`,
          appkey: appKey,
          appsecret: appSecret,
          tr_id: "FHKST01010400",
          custtype: "P",
        },
        params: {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: stockCode.trim(),
          FID_PERIOD_DIV_CODE: periodCode,
          FID_ORG_ADJ_PRC: adjustPrice,
        },
      });

      if (data.rt_cd !== "0") {
        throw new HttpException(
          data.msg1 || "일자별 주가 조회 실패",
          HttpStatus.BAD_GATEWAY,
        );
      }

      const result = data.output.map((item: Record<string, any>) => {
        const parsed: Record<string, any> = {};
        for (const [key, value] of Object.entries(item)) {
          const label = labelMap[key] || key;
          parsed[label] =
            key === "flng_cls_code"
              ? flngClsCodeMap[String(value)] || value
              : value;
        }
        return parsed;
      });

      return result;
    } catch (error: any) {
      console.error(
        "KIS 일자별 시세 요청 실패:",
        error.response?.data || error,
      );
      throw new HttpException(
        "한국투자증권 API 호출 실패",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 기업명을 기반으로 종목 코드를 추출
   * @param company 기업명
   * @returns 종목 코드 (6자리)
   */
  private async getStockCodeFromCompany(company: string): Promise<string> {
    const prompt = `${company}의 한국 증권 종목코드를 숫자 6자리로 알려줘.`;
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const stockCode =
      completion.choices[0].message.content?.match(/\d{6}/)?.[0];
    if (!stockCode) {
      throw new HttpException("종목코드 인식 실패", HttpStatus.BAD_REQUEST);
    }
    return stockCode;
  }
}
