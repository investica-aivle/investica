// client/src/components/portfolio/PortfolioHeader.tsx
import { useState, useEffect } from 'react';
import { getPortfolioSummary, type PortfolioSummary } from '../../apis/portfolio';

interface PortfolioHeaderProps {
  // API에서 실제 데이터를 가져오므로 props는 선택적으로 변경
  fallbackData?: Partial<PortfolioSummary>;
}

export function PortfolioHeader({ fallbackData }: PortfolioHeaderProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 포트폴리오 데이터 가져오기
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPortfolioSummary();
        setPortfolioData(data);
      } catch (err: any) {
        console.error('포트폴리오 데이터 로딩 실패:', err);
        const errorMessage = err.message || '포트폴리오 데이터를 불러올 수 없습니다.';
        setError(errorMessage);

        if (fallbackData) {
          setPortfolioData({
            totalValue: fallbackData.totalValue || 0,
            changeAmount: fallbackData.changeAmount || 0,
            changePercent: fallbackData.changePercent || 0,
            totalInvestment: fallbackData.totalInvestment || 0,
            stockCount: fallbackData.stockCount || 0,
            message: fallbackData.message || '임시 데이터를 표시중입니다'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, [fallbackData]);

  // 재시도 함수
  const handleRetry = () => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPortfolioSummary();
        setPortfolioData(data);
      } catch (err: any) {
        console.error('포트폴리오 데이터 재시도 실패:', err);
        const errorMessage = err.message || '포트폴리오 데이터를 불러올 수 없습니다.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-12 bg-zinc-700 rounded mb-4 mx-auto w-48"></div>
            <div className="h-6 bg-zinc-700 rounded mb-6 mx-auto w-32"></div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-4 bg-zinc-700 rounded mb-2"></div>
                  <div className="h-6 bg-zinc-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-400 mt-4">
            포트폴리오 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 (폴백 데이터도 없는 경우)
  if (error && !portfolioData) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
        <div className="text-center text-red-400">
          <div className="text-lg font-medium mb-2">⚠️ 오류 발생</div>
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

  if (!portfolioData) return null;

  const { totalValue, changeAmount, changePercent, totalInvestment, stockCount, message } = portfolioData;
  const isPositive = changeAmount >= 0;

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      {/* 에러가 있지만 폴백 데이터를 사용 중인 경우 경고 표시 */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs text-yellow-400">
              ⚠️ {error}
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
            >
              재시도
            </button>
          </div>
        </div>
      )}

      {/* 총 평가금액 */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-400 mb-1">내 주식 총 가치</div>
        <div className="text-4xl font-bold text-white mb-2">
          {totalValue.toLocaleString()}원
        </div>
        <div className={`text-lg font-medium ${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
          {isPositive ? '+' : ''}{changeAmount.toLocaleString()}원{' '}
          ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isPositive ? '👍 수익이 발생했어요!' : '📉 손실이 있어요'}
        </div>
        {/* 서버에서 온 메시지 표시 */}
        {message && (
          <div className="text-sm text-gray-400 mt-2">
            {message}
          </div>
        )}
      </div>

      {/* 포트폴리오 요약 정보 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center p-4 bg-zinc-700/20 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">총 투자원금</div>
          <div className="text-lg font-semibold text-white mb-1">
            {totalInvestment.toLocaleString()}원
          </div>
          <div className="text-xs text-gray-500">
            💰 주식 사는데 쓴 돈
          </div>
        </div>
        <div className="text-center p-4 bg-zinc-700/20 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">보유종목 수</div>
          <div className="text-lg font-semibold text-white mb-1">
            {stockCount}개
          </div>
          <div className="text-xs text-gray-500">
            🏢 가진 회사 수
          </div>
        </div>
        <div className="text-center p-4 bg-zinc-700/20 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">총 수익률</div>
          <div className={`text-lg font-semibold mb-1 ${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
            {changePercent.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">
            📊 원금 대비 수익률
          </div>
        </div>
      </div>

      {/* 간단한 계산 설명 */}
      <div className="mt-6 p-4 bg-zinc-700/10 rounded-lg border border-zinc-600/20">
        <div className="text-xs text-gray-400 text-center">
          <div className="mb-1">💡 계산 공식</div>
          <div>투자원금 {totalInvestment.toLocaleString()}원 → 현재가치 {totalValue.toLocaleString()}원</div>
          <div className="mt-1">
            수익: {changeAmount.toLocaleString()}원 = {totalValue.toLocaleString()}원 - {totalInvestment.toLocaleString()}원
          </div>
        </div>
      </div>
    </div>
  );
}
