import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

interface TopMarketCapStock {
  rank: number;
  stockCode: string;
  stockName: string;
  marketCap: number; // 시가총액 (단위: 백만원)
  changeRate: number; // 전일대비등락율 (%)
  currentPrice: number; // 현재가
  changeAmount: number; // 전일대비
  marketCategory: string; // 시장구분
}

@Injectable()
export class StocksOverviewProvider {
  private readonly baseUrl =
    "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo";
  private readonly serviceKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const serviceKey = this.configService.get<string>("PUBLIC_DATA_API_KEY");
    if (!serviceKey) {
      throw new InternalServerErrorException(
        "Public Data API Key not found in configuration.",
      );
    }
    this.serviceKey = serviceKey;
  }

  /**
   * 상위 시가총액 기업의 주식 정보 조회
   */
  async getTopMarketCapStocks(limit: number = 10): Promise<{
    message: string;
    stocks: TopMarketCapStock[];
    totalCount: number;
  }> {
    try {
      console.log("🔄 상위 시가총액 주식 정보 조회 시작");

      // 공공데이터포털 API 호출 - 시가총액 30,000,000 이상, 코스피 시장만
      const response = await firstValueFrom(
        this.httpService.get<StockPriceResponse>(this.baseUrl, {
          params: {
            serviceKey: this.serviceKey,
            numOfRows: 100, // 충분한 데이터 가져오기
            pageNo: 1,
            resultType: "json",
            beginMrktTotAmt: "30000000", // 시가총액 30,000,000 이상
            mrktCtg: "KOSPI", // 코스피 시장만
          },
        }),
      );

      if (response.data.header.resultCode !== "00") {
        throw new Error(`API 호출 실패: ${response.data.header.resultMsg}`);
      }

      const stocks = response.data.body.items.item;
      console.log(`📊 총 ${stocks.length}개 종목 데이터 수신`);

      // 시가총액 내림차순 정렬 후 상위 10개 선택
      const filteredStocks = stocks
        .sort((a: StockPriceInfo, b: StockPriceInfo) => {
          // 시가총액 내림차순 정렬
          return b.mrktTotAmt - a.mrktTotAmt;
        })
        .slice(0, limit) // 상위 limit개만
        .map((stock: StockPriceInfo, index: number) => ({
          rank: index + 1,
          stockCode: stock.srtnCd,
          stockName: stock.itmsNm,
          marketCap: stock.mrktTotAmt / 1000000, // 백만원 단위로 변환
          changeRate: stock.fltRt,
          currentPrice: parseInt(stock.clpr),
          changeAmount: stock.vs,
          marketCategory: stock.mrktCtg,
        }));

      console.log(
        `✅ 상위 ${filteredStocks.length}개 시가총액 기업 정보 조회 완료`,
      );

      return {
        message: `상위 ${filteredStocks.length}개 시가총액 기업 정보를 성공적으로 조회했습니다.`,
        stocks: filteredStocks,
        totalCount: filteredStocks.length,
      };
    } catch (error) {
      console.error("❌ 상위 시가총액 주식 정보 조회 실패:", error);
      throw new InternalServerErrorException(
        `주식 정보 조회 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

interface StockPriceInfo {
  itmsNm: string; // 종목명
  mrktCtg: string; // 시장구분
  clpr: string; // 종가
  vs: number; // 대비
  fltRt: number; // 등락율
  mkp: number; // 시가
  hipr: number; // 고가
  lopr: number; // 저가
  trqu: number; // 거래량
  trPrc: number; // 거래대금
  lstgStCnt: number; // 상장주식수
  basDt: string; // 기준일자
  srtnCd: string; // 종목코드
  isinCd: string; // ISIN코드
  mrktTotAmt: number; // 시가총액
}

interface StockPriceResponse {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    numOfRows: string;
    pageNo: string;
    items: {
      item: StockPriceInfo[];
    };
    totalCount: string;
  };
}
