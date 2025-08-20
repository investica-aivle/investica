import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, Logger } from "@nestjs/common";
import { StockCodeService } from "../../providers/stock/StockCodeService";
import { StockSearchResult } from "../../types/stock.types";

/**
 * Stock Search API Controller
 *
 * 종목 검색 관련 REST API 엔드포인트를 제공합니다.
 */
@Controller("api/stock")
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(private readonly stockCodeService: StockCodeService) {}

  /**
   * 종목 자동완성 검색
   *
   * 통합 자동완성 검색 API:
   * - 숫자 입력시: 종목코드 접두사 검색 (작은 숫자 우선 정렬)
   * - 문자 입력시: 종목명 유사도 검색 (완전일치 > 시작일치 > 포함일치 순)
   *
   * @summary 종목 자동완성 검색
   * @param query 검색어 (종목명 또는 종목코드)
   * @param limit 결과 개수 (기본값: 10)
   * @returns 자동완성 검색 결과
   *
   * @tag Stock
   */
  @TypedRoute.Get("search")
  public searchStocks(
    @TypedQuery() query: { query: string; limit?: number }
  ): StockSearchResult[] {
    const { query: searchQuery, limit = 10 } = query;

    this.logger.log(`종목 검색 요청: "${searchQuery}", 제한: ${limit}`);

    if (!searchQuery?.trim()) {
      this.logger.warn("빈 검색어로 요청됨");
      return [];
    }

    try {
      const results = this.stockCodeService.searchStocks(searchQuery, limit);
      this.logger.log(`검색 완료: ${results.length}개 결과 반환`);
      return results;
    } catch (error) {
      this.logger.error(`종목 검색 실패: ${error}`);
      return [];
    }
  }
}
