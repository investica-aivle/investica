// client/src/components/portfolio/StockHoldingsList.tsx

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { getStockHoldings, type StockHolding } from '../../apis/portfolio';

export function StockHoldingsList() {
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 보유 주식 데이터 가져오기
  useEffect(() => {
    const fetchStockHoldings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getStockHoldings();
        setHoldings(data);
      } catch (err: any) {
        console.error('보유 주식 데이터 로딩 실패:', err);
        const errorMessage = err.message || '보유 주식 정보를 불러올 수 없습니다.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockHoldings();
  }, []);

  // 재시도 함수
  const handleRetry = () => {
    const fetchStockHoldings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getStockHoldings();
        setHoldings(data);
      } catch (err: any) {
        console.error('보유 주식 데이터 재시도 실패:', err);
        const errorMessage = err.message || '보유 주식 정보를 불러올 수 없습니다.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockHoldings();
  };

  // 숫자 포맷팅 헬퍼 함수
  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // 평가금액 대비 비중 계산
  const calculatePercentage = (holding: StockHolding) => {
    const totalValue = holdings.reduce((sum, h) => sum + formatNumber(h.evlu_amt), 0);
    const holdingValue = formatNumber(holding.evlu_amt);
    return totalValue > 0 ? (holdingValue / totalValue) * 100 : 0;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
        <h3 className="text-lg font-semibold text-white mb-4">보유 주식</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin mr-2" />
          <span className="text-gray-400">보유 주식 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
        <h3 className="text-lg font-semibold text-white mb-4">보유 주식</h3>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">⚠️ 오류 발생</div>
          <div className="text-sm text-gray-400 mb-4">{error}</div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 보유 주식이 없는 경우
  if (holdings.length === 0) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
        <h3 className="text-lg font-semibold text-white mb-4">보유 주식</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📈</div>
          <div className="text-sm text-gray-400">보유중인 주식이 없습니다</div>
          <div className="text-xs text-gray-500 mt-1">주식을 매수하면 여기에 표시됩니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">보유 주식</h3>
        <span className="text-sm text-gray-400">{holdings.length}개 종목</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {holdings.map((holding, index) => {
          const changePercent = formatNumber(holding.evlu_pfls_rt);
          const percentage = calculatePercentage(holding);
          const isPositive = changePercent >= 0;
          const currentPrice = formatNumber(holding.prpr);
          const avgPrice = formatNumber(holding.pchs_avg_pric);
          const totalShares = formatNumber(holding.hldg_qty);
          const totalValue = formatNumber(holding.evlu_amt);
          const profitLoss = formatNumber(holding.evlu_pfls_amt);

          return (
            <div
              key={`${holding.pdno}-${index}`}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 transition-colors cursor-pointer border border-zinc-600/20"
            >
              {/* 왼쪽: 종목명과 기본 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-white text-sm truncate">
                    {holding.prdt_name}
                  </h4>
                  <span className="text-xs text-gray-400 bg-zinc-600/30 px-1.5 py-0.5 rounded">
                    {holding.pdno}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {totalShares.toLocaleString()}주 보유 • 비중 {percentage.toFixed(1)}%
                </div>
              </div>

              {/* 중앙: 가격 정보 */}
              <div className="text-center mx-4">
                <div className="text-sm font-medium text-white">
                  현재가: {currentPrice.toLocaleString()}원
                </div>
                <div className="text-sm text-gray-300">
                  매입평균: {avgPrice.toLocaleString()}원
                </div>
              </div>

              {/* 오른쪽 중앙: 평가금액 */}
              <div className="text-center mx-4">
                <div className="text-sm font-semibold text-white">
                  {totalValue.toLocaleString()}원
                </div>
                <div className="text-xs text-gray-400">
                  평가금액
                </div>
              </div>

              {/* 오른쪽: 수익률과 손익 */}
              <div className="text-right min-w-0">
                <div className="flex items-center justify-end space-x-1 mb-1">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-red-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-blue-400" />
                  )}
                  <span className={`text-sm font-semibold ${
                    isPositive ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className={`text-xs font-medium ${
                  isPositive ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {isPositive ? '+' : ''}{profitLoss.toLocaleString()}원
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 푸터 정보 */}
      <div className="mt-4 pt-4 border-t border-zinc-700/50">
        <div className="text-xs text-gray-400 text-center">
          실시간 데이터는 지연될 수 있습니다
        </div>
      </div>
    </div>
  );
}
