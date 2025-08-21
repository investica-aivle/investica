import { Controller, Get, Param, Query } from "@nestjs/common";

import { StocksOverviewProvider } from "../../providers/stocks/StocksOverviewProvider";

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

interface StocksOverviewResponse {
  message: string;
  stocks: TopMarketCapStock[];
  totalCount: number;
}

@Controller("api/stockoverview")
export class StocksOverviewController {
  constructor(
    private readonly stocksOverviewProvider: StocksOverviewProvider,
  ) {}

  /**
   * 상위 시가총액 기업의 주식 정보 조회
   */
  @Get("top")
  async getTopMarketCapStocks(
    @Query("limit") limit?: number,
  ): Promise<StocksOverviewResponse> {
    const limitNumber = limit ? parseInt(limit.toString()) : 10;
    return await this.stocksOverviewProvider.getTopMarketCapStocks(limitNumber);
  }

  /**
   * 특정 순위까지의 시가총액 기업 조회
   */
  @Get("top/:rank")
  async getTopStocksByRank(
    @Param("rank") rank: string,
  ): Promise<StocksOverviewResponse> {
    const rankNumber = parseInt(rank);
    if (isNaN(rankNumber) || rankNumber <= 0) {
      return {
        message: "유효하지 않은 순위입니다. 1 이상의 숫자를 입력해주세요.",
        stocks: [],
        totalCount: 0,
      };
    }
    return await this.stocksOverviewProvider.getTopMarketCapStocks(rankNumber);
  }
}
