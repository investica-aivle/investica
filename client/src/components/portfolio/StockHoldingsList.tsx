// client/src/components/portfolio/StockHoldingsList.tsx

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockHolding {
  name: string;
  code?: string;
  shares: number;
  value: number;
  percentage: number;
  changePercent: number;
}

export function StockHoldingsList() {
  const holdings: StockHolding[] = [
    {
      name: '삼성전자',
      code: '005930',
      shares: 50,
      value: 3900000,
      percentage: 25.3,
      changePercent: 2.1
    },
    {
      name: 'LG에너지솔루션',
      code: '373220',
      shares: 8,
      value: 3520000,
      percentage: 22.8,
      changePercent: 5.7
    },
    {
      name: 'LG화학',
      code: '051910',
      shares: 6,
      value: 2388000,
      percentage: 15.5,
      changePercent: -1.2
    },
    {
      name: '현대차',
      code: '005380',
      shares: 12,
      value: 1896000,
      percentage: 12.3,
      changePercent: 3.4
    },
    {
      name: '셀트리온',
      code: '068270',
      shares: 7,
      value: 1337000,
      percentage: 8.7,
      changePercent: 1.8
    }
  ];

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">보유 주식</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {holdings.map((holding, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 transition-colors cursor-pointer"
          >
            {/* 주식 정보 */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-white text-sm">
                  {holding.name}
                </h4>
                {holding.code && (
                  <span className="text-xs text-gray-400">
                    {holding.code}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {holding.shares}주
              </div>
            </div>

            {/* 금액 및 비중 */}
            <div className="text-right mr-4">
              <div className="font-semibold text-white text-sm">
                {holding.value.toLocaleString()}원
              </div>
              <div className="text-xs text-gray-400">
                {holding.percentage}%
              </div>
            </div>

            {/* 수익률 */}
            <div className="flex items-center space-x-1">
              {holding.changePercent >= 0 ? (
                <TrendingUp className="w-4 h-4 text-red-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-blue-400" />
              )}
              <span className={`text-sm font-medium ${
                holding.changePercent >= 0 ? 'text-red-400' : 'text-blue-400'
              }`}>
                {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 요약 정보 */}
      <div className="mt-4 pt-4 border-t border-zinc-700/50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">총 보유 종목</span>
          <span className="font-medium text-white">{holdings.length}개</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-gray-400">총 투자 금액</span>
          <span className="font-medium text-white">
            {holdings.reduce((sum, holding) => sum + holding.value, 0).toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}
