export interface StockInfo {
  code: string;           // 종목코드 (6자리)
  name: string;          // 종목명 (한글)
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX'; // 시장구분
}

export interface StockSearchResult {
  code: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX';
}
