import { useState } from 'react';
import { TradingSection } from './TradingSection';
import { PriceSection } from './PriceSection';

interface TargetStock {
  symbol: string;
  name: string;
}

export function TradingTab() {
  const [targetStock, setTargetStock] = useState<TargetStock | null>(null);

  const handleAutoInvestSetup = () => {
    // 자동 투자 설정 로직 구현
    console.log('자동 투자 설정');
  };

  const handleStockSelect = (stock: TargetStock) => {
    setTargetStock(stock);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg text-gray-100">매매 기능</h3>

      {/* 실시간 시세 영역 */}
      <PriceSection targetStock={targetStock} onStockSelect={handleStockSelect} />

      {/* 간편 매매 섹션 */}
      <TradingSection targetStock={targetStock} />

      {/* 자동 투자 섹션 */}
      <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
        <h4 className="text-sm font-medium mb-3 text-gray-100">자동 투자</h4>
        <div className="text-xs text-gray-400 mb-3">
          AI 기반 자동 매매 전략을 설정하세요
        </div>
        <button
          onClick={handleAutoInvestSetup}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-colors"
        >
          자동 투자 설정
        </button>
      </div>
    </div>
  );
}
