import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

interface TopMarketCapStock {
  rank: number;
  stockCode: string;
  stockName: string;
  marketCap: number; // 시가총액
  changeRate: number; // 전일대비등락율 (%)
  currentPrice: number; // 현재가
  changeAmount: number; // 전일대비
  marketCategory: string; // 시장구분
  date: string; // 기준일자 (yyyymmdd)
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

      // 7일 전 날짜를 yyyymmdd 형식으로 생성
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const beginBasDt =
        sevenDaysAgo.getFullYear().toString() +
        (sevenDaysAgo.getMonth() + 1).toString().padStart(2, "0") +
        sevenDaysAgo.getDate().toString().padStart(2, "0");

      console.log(`📅 7일 전 날짜: ${beginBasDt}`);

      // 공공데이터포털 API 호출 - 7일 전부터 데이터 요청
      const response = await firstValueFrom(
        this.httpService.get<StockPriceResponse>(this.baseUrl, {
          params: {
            serviceKey: this.serviceKey,
            numOfRows: 200, // 더 많은 데이터 가져오기
            pageNo: 1,
            resultType: "json",
            beginBasDt: beginBasDt, // 7일 전부터
            beginMrktTotAmt: "20000000000000", // 시가총액 30,000,000 이상
            mrktCtg: "KOSPI", // 코스피 시장만
          },
        }),
      );
      console.log(
        response?.data,
        response?.data?.response?.body?.items?.item?.length ?? "0" + "개",
      );

      console.log(JSON.stringify(response.data, null, 2));
      // 응답 구조 확인 및 에러 처리 개선
      if (
        !response.data ||
        !response.data.response ||
        !response.data.response.header
      ) {
        throw new Error("API 응답 구조가 올바르지 않습니다.");
      }

      if (response.data.response.header.resultCode !== "00") {
        throw new Error(
          `API 호출 실패: ${response.data.response.header.resultMsg || "알 수 없는 오류"}`,
        );
      }

      // 응답 데이터 구조 확인
      if (!response.data.response.body || !response.data.response.body.items) {
        throw new Error("주식 데이터가 없습니다.");
      }

      const stocks = response.data.response.body.items.item;
      if (!stocks || !Array.isArray(stocks)) {
        throw new Error("주식 데이터 형식이 올바르지 않습니다.");
      }

      console.log(`📊 총 ${stocks.length}개 종목 데이터 수신`);

      // 가장 최근 날짜 찾기
      const latestDate = stocks.reduce(
        (latest: string, stock: StockPriceInfo) => {
          return stock.basDt > latest ? stock.basDt : latest;
        },
        stocks[0]?.basDt || "",
      );

      console.log(`📅 가장 최근 날짜: ${latestDate}`);

      // 가장 최근 날짜의 데이터만 필터링
      const latestStocks = stocks.filter(
        (stock: StockPriceInfo) => stock.basDt === latestDate,
      );
      console.log(`📊 최근 날짜 데이터: ${latestStocks.length}개 종목`);

      // 첫 번째 종목의 등락 정보 확인
      if (latestStocks.length > 0) {
        const firstStock = latestStocks[0];
        console.log(
          `📈 샘플 데이터 - ${firstStock.itmsNm}: 등락율=${firstStock.fltRt}%, 대비=${firstStock.vs}`,
        );
      }

      // 시가총액 내림차순 정렬 후 상위 10개 선택
      const filteredStocks = latestStocks
        .sort((a: StockPriceInfo, b: StockPriceInfo) => {
          // 시가총액 내림차순 정렬
          return parseInt(b.mrktTotAmt) - parseInt(a.mrktTotAmt);
        })
        .slice(0, limit) // 상위 limit개만
        .map((stock: StockPriceInfo, index: number) => ({
          rank: index + 1,
          stockCode: stock.srtnCd,
          stockName: stock.itmsNm,
          marketCap: parseInt(stock.mrktTotAmt.toString()),
          changeRate: Number(stock.fltRt),
          currentPrice: Number(stock.clpr),
          changeAmount: Number(stock.vs),
          marketCategory: stock.mrktCtg,
          date: stock.basDt,
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
  vs: string; // 대비
  fltRt: string; // 등락율
  mkp: string; // 시가
  hipr: string; // 고가
  lopr: string; // 저가
  trqu: string; // 거래량
  trPrc: string; // 거래대금
  lstgStCnt: string; // 상장주식수
  basDt: string; // 기준일자
  srtnCd: string; // 종목코드
  isinCd: string; // ISIN코드
  mrktTotAmt: string; // 시가총액
}

interface StockPriceResponse {
  response: {
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
  };
}
