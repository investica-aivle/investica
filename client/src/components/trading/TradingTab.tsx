import { useState } from 'react';
import { TradingSection } from './TradingSection';
import { PriceSection } from './PriceSection';

interface TargetStock {
  symbol: string;
  name: string;
}

export function TradingTab() {
  const [targetStock, setTargetStock] = useState<TargetStock | null>(null);

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
    </div>
  );
}
