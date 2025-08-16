import axios from 'axios';
import { StockDailyPricesResponse, StockOverviewResponse, StockPriceResponse, StockTradesResponse } from '../models/Stock';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const stockApi = {
  /**
   * 상위 주식 목록 조회
   */
  getTopStocks: (): Promise<StockOverviewResponse> => {
    return axios.get(`${API_BASE_URL}/stockoverview/top`)
      .then(response => response.data);
  },

  /**
   * 주식 현재가 조회
   */
  getStockPrice: (company: string): Promise<StockPriceResponse> => {
    return axios.get(`${API_BASE_URL}/stock/price`, {
      params: { company }
    })
      .then(response => response.data);
  },

  /**
   * 주식 체결 정보 조회
   */
  getStockTrades: (company: string): Promise<StockTradesResponse> => {
    return axios.get(`${API_BASE_URL}/stock/trades`, {
      params: { company }
    })
      .then(response => response.data);
  },

  /**
   * 주식 일별 가격 조회
   */
  getStockDailyPrices: (company: string, periodCode?: "D" | "W" | "M", adjustPrice?: 0 | 1): Promise<StockDailyPricesResponse> => {
    return axios.get(`${API_BASE_URL}/stock/daily-prices`, {
      params: { company, periodCode, adjustPrice }
    })
      .then(response => response.data);
  }
};

export default stockApi;
