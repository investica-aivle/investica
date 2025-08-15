import { useState } from 'react';

export function TradingSection() {
  const [stockInput, setStockInput] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleBuy = () => {
    if (!stockInput || !quantity) {
      alert('종목과 수량을 입력해주세요.');
      return;
    }
    // 매수 로직 구현
    console.log('매수:', { stock: stockInput, quantity });
  };

  const handleSell = () => {
    if (!stockInput || !quantity) {
      alert('종목과 수량을 입력해주세요.');
      return;
    }
    // 매도 로직 구현
    console.log('매도:', { stock: stockInput, quantity });
  };

  return (
    <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
      <h4 className="text-sm font-medium mb-3 text-gray-100">간편 매매</h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            종목 코드/이름
          </label>
          <input
            type="text"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
            placeholder="예: 삼성전자, 005930"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            수량
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
            placeholder="수량 입력"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleBuy}
            className="flex-1 bg-green-700/50 hover:bg-green-600/50 text-white py-2 rounded-xl text-sm transition-colors"
          >
            매수
          </button>
          <button
            onClick={handleSell}
            className="flex-1 bg-red-700/50 hover:bg-red-600/50 text-white py-2 rounded-xl text-sm transition-colors"
          >
            매도
          </button>
        </div>
      </div>
    </div>
  );
}
