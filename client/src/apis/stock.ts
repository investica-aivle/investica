import { StockDailyPricesResponse, StockOverviewResponse, StockPriceResponse, StockTradesResponse } from '../models/Stock';
import apiClient from './index';

const stockApi = {
  /**
   * 상위 주식 목록 조회
   */
  getTopStocks: (): Promise<StockOverviewResponse> => {
    return apiClient.get('/stockoverview/top')
      .then(response => response.data);
  },

  /**
   * 주식 현재가 조회
   */
  getStockPrice: (company: string): Promise<StockPriceResponse> => {
    return apiClient.get('/stock/price', {
      params: { company }
    })
      .then(response => response.data);
  },

  /**
   * 주식 체결 정보 조회
   */
  getStockTrades: (company: string): Promise<StockTradesResponse> => {
    return apiClient.get('/stock/trades', {
      params: { company }
    })
      .then(response => response.data);
  },

  /**
   * 주식 일별 가격 조회
   */
  getStockDailyPrices: (company: string, periodCode?: "D" | "W" | "M", adjustPrice?: 0 | 1): Promise<StockDailyPricesResponse> => {
    return apiClient.get('/stock/daily-prices', {
      params: { company, periodCode, adjustPrice }
    })
      .then(response => response.data);
  }
};

export default stockApi;
