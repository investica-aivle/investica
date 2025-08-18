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
export class KisPriceProvider {
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

  /**
   * 코스피 지수 일/주/월/년 시세 조회
   * @param periodCode 기간구분 (D:일, W:주, M:월, Y:년)
   * @param startDate 시작일자 (YYYYMMDD)
   * @param endDate 종료일자 (YYYYMMDD)
   * @param session KIS 인증 세션
   * @returns 코스피 지수 시세 데이터 배열
   */
  public async fetchKospiIndexPrices(
    periodCode: string = "D",
    startDate?: string,
    endDate?: string,
    session?: IKisSessionData,
  ) {
    const defaultStartDate = startDate || this.getDefaultStartDate(periodCode);
    const defaultEndDate = endDate || this.getDefaultEndDate();

    if (!session) {
      throw new HttpException(
        "KIS 인증 세션이 필요합니다",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { accessToken, appKey, appSecret } = session;

    try {
      // 국내주식업종기간별시세(일/주/월/년) API 사용 - KOSPI 200 (업종코드: 2001)

      const url = `${this.KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice`;
      const requestParams = {
        FID_COND_MRKT_DIV_CODE: "U", // 업종
        FID_INPUT_ISCD: "2001", // KOSPI 200 업종코드
        FID_PERIOD_DIV_CODE: periodCode, // D:일, W:주, M:월, Y:년
        FID_INPUT_DATE_1: defaultStartDate, // 조회시작일자
        FID_INPUT_DATE_2: defaultEndDate, // 조회종료일자
      };

      const requestHeaders = {
        "content-type": "application/json; charset=utf-8",
        authorization: `Bearer ${accessToken}`,
        appkey: appKey,
        appsecret: appSecret,
        tr_id: "FHKUP03500100", // 국내주식업종기간별시세(일/주/월/년) TR ID
        custtype: "P",
      };

      // API 요청 정보 로그
      console.log("=== 코스피 API 요청 정보 ===");
      console.log("URL:", url);
      console.log("Headers:", JSON.stringify(requestHeaders, null, 2));
      console.log("Params:", JSON.stringify(requestParams, null, 2));

      const { data } = await this.http.axiosRef.get(url, {
        headers: requestHeaders,
        params: requestParams,
      });

      // API 응답 구조 디버깅
      console.log("=== 코스피 API 응답 구조 ===");
      console.log("data:", JSON.stringify(data, null, 2));
      console.log("data.output 타입:", typeof data.output);
      console.log("data.output:", data.output);
      if (data.rt_cd !== "0") {
        throw new HttpException(
          data.msg1 || "코스피 지수 시세 조회 실패",
          HttpStatus.BAD_GATEWAY,
        );
      }

      // output2 배열에서 일별 데이터 추출
      const outputData = data.output2;
      if (!Array.isArray(outputData)) {
        console.error("예상치 못한 output2 구조:", outputData);
        throw new HttpException(
          "코스피 지수 데이터 구조 오류",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const result = outputData.map((item: Record<string, any>) => {
        const parsed: Record<string, any> = {};
        for (const [key, value] of Object.entries(item)) {
          const label = this.getKospiLabelMap(key);
          parsed[label] = value;
        }
        return parsed;
      });

      return result;
    } catch (error: any) {
      console.error(
        "KIS 코스피 지수 시세 요청 실패:",
        error.response?.data || error,
      );
      throw new HttpException(
        "한국투자증권 API 호출 실패",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 코스피 시세 데이터 라벨 매핑
   * @param key API 응답 키
   * @returns 한글 라벨
   */
  private getKospiLabelMap(key: string): string {
    const kospiLabelMap: Record<string, string> = {
      stck_bsop_date: "기준일자",
      bstp_nmix_oprc: "시가",
      bstp_nmix_hgpr: "고가",
      bstp_nmix_lwpr: "저가",
      bstp_nmix_prpr: "종가",
      acml_vol: "거래량",
      acml_tr_pbmn: "누적거래대금",
      mod_yn: "수정여부",
    };

    return kospiLabelMap[key] || key;
  }

  /**
   * 기본 시작일 계산 (기간구분에 따라)
   * @param periodCode 기간구분
   * @returns YYYYMMDD 형식의 시작일
   */
  private getDefaultStartDate(periodCode: string): string {
    const today = new Date();
    let daysToSubtract = 30; // 기본 30일

    switch (periodCode) {
      case "D":
        daysToSubtract = 7; // 일별: 1주일
        break;
      case "W":
        daysToSubtract = 84; // 주별: 12주 (약 3개월)
        break;
      case "M":
        daysToSubtract = 180; // 월별: 6개월
        break;
      case "Y":
        daysToSubtract = 1825; // 년별: 5년
        break;
    }

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToSubtract);

    return startDate.toISOString().slice(0, 10).replace(/-/g, "");
  }

  /**
   * 기본 종료일 계산 (오늘)
   * @returns YYYYMMDD 형식의 종료일
   */
  private getDefaultEndDate(): string {
    const today = new Date();
    return today.toISOString().slice(0, 10).replace(/-/g, "");
  }
}
