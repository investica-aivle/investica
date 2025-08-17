import { TradingSection } from './TradingSection';
import { PriceSection } from './PriceSection';
import { useAppSelector, useAppDispatch, selectTargetStock } from '../../store/hooks';
import { setTargetStock } from '../../store/slices/tradingSlice';
import { StockInfo } from '../../types/agentica';

export function TradingTab() {
  const targetStock = useAppSelector(selectTargetStock);
  const dispatch = useAppDispatch();

  const handleStockSelect = (stock: StockInfo) => {
    dispatch(setTargetStock(stock));
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
