// client/src/components/portfolio/PortfolioHeader.tsx

interface PortfolioHeaderProps {
  totalValue?: number;
  changeAmount?: number;
  changePercent?: number;
  totalInvestment?: number;
  stockCount?: number;
  dividendYield?: number;
}

export function PortfolioHeader({
  totalValue = 15420000,
  changeAmount = 320000,
  changePercent = 2.12,
  totalInvestment = 15100000,
  stockCount = 8,
  dividendYield = 2.8
}: PortfolioHeaderProps) {
  const isPositive = changeAmount >= 0;

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      {/* 총 평가금액 */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-white mb-2">
          {totalValue.toLocaleString()}원
        </div>
        <div className={`text-lg font-medium ${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
          {isPositive ? '+' : ''}{changeAmount.toLocaleString()}원{' '}
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </div>
      </div>

      {/* 포트폴리오 요약 정보 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">투자원금</div>
          <div className="text-lg font-semibold text-white">
            {totalInvestment.toLocaleString()}원
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">보유종목</div>
          <div className="text-lg font-semibold text-white">
            {stockCount}개
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">배당수익률</div>
          <div className="text-lg font-semibold text-white">
            {dividendYield}%
          </div>
        </div>
      </div>
    </div>
  );
}
