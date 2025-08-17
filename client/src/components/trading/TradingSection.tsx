import { useState, useEffect } from 'react';

interface TargetStock {
  symbol: string;
  name: string;
}

interface TradingSectionProps {
  targetStock: TargetStock | null;
}

export function TradingSection({ targetStock }: TradingSectionProps) {
  const [stockInput, setStockInput] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderCondition, setOrderCondition] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState('');

  // 타겟 주식이 변경될 때 입력 필드 업데이트
  useEffect(() => {
    if (targetStock) {
      setStockInput(targetStock.name);
    }
  }, [targetStock]);

  // 시장가로 변경될 때 가격 입력값 초기화
  useEffect(() => {
    if (orderCondition === 'market') {
      setPrice('');
    }
  }, [orderCondition]);

  const handleBuy = () => {
    if (!stockInput || !quantity) {
      alert('종목과 수량을 입력해주세요.');
      return;
    }

    if (orderCondition === 'limit' && !price) {
      alert('지정가 주문은 가격을 입력해주세요.');
      return;
    }

    // 매수 로직 구현
    console.log('매수:', {
      stock: stockInput,
      quantity,
      orderCondition,
      price: orderCondition === 'limit' ? price : undefined
    });
  };

  const handleSell = () => {
    if (!stockInput || !quantity) {
      alert('종목과 수량을 입력해주세요.');
      return;
    }

    if (orderCondition === 'limit' && !price) {
      alert('지정가 주문은 가격을 입력해주세요.');
      return;
    }

    // 매도 로직 구현
    console.log('매도:', {
      stock: stockInput,
      quantity,
      orderCondition,
      price: orderCondition === 'limit' ? price : undefined
    });
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

        {/* 주문 조건 선택 */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            주문 조건
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setOrderCondition('market')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm transition-colors ${
                orderCondition === 'market'
                  ? 'bg-blue-600/50 text-white border border-blue-500/50'
                  : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-800/70 border border-zinc-600/30'
              }`}
            >
              시장가
            </button>
            <button
              onClick={() => setOrderCondition('limit')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm transition-colors ${
                orderCondition === 'limit'
                  ? 'bg-blue-600/50 text-white border border-blue-500/50'
                  : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-800/70 border border-zinc-600/30'
              }`}
            >
              지정가
            </button>
          </div>
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

        {/* 지정가일 때만 가격 입력 표시 */}
        {orderCondition === 'limit' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              가격 (원)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="가격 입력"
            />
          </div>
        )}

        {/* 시장가일 때 안내 메시지 */}
        {orderCondition === 'market' && (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-xs text-blue-300">
              시장가 주문: 현재 시장 최우선 호가로 즉시 체결됩니다.
            </p>
          </div>
        )}

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
