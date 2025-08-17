import { useState, useEffect } from 'react';
import { SessionManager } from '../../utils/sessionManager';
import { OrderConfirmation } from './OrderConfirmation';

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
  const [isLoading, setIsLoading] = useState(false);

  // 확인 창 상태
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrderType, setPendingOrderType] = useState<'buy' | 'sell' | null>(null);

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

  const validateInputs = () => {
    if (!stockInput || !quantity) {
      alert('종목과 수량을 입력해주세요.');
      return false;
    }

    if (orderCondition === 'limit' && !price) {
      alert('지정가 주문은 가격을 입력해주세요.');
      return false;
    }

    if (parseInt(quantity) <= 0) {
      alert('수량은 1주 이상 입력해주세요.');
      return false;
    }

    if (orderCondition === 'limit' && parseInt(price) <= 0) {
      alert('가격은 0원보다 커야 합니다.');
      return false;
    }

    return true;
  };

  const handleBuyClick = () => {
    if (!validateInputs()) return;

    setPendingOrderType('buy');
    setShowConfirmation(true);
  };

  const handleSellClick = () => {
    if (!validateInputs()) return;

    setPendingOrderType('sell');
    setShowConfirmation(true);
  };

  const executeOrder = async (orderType: 'buy' | 'sell') => {
    // 세션 확인
    const session = SessionManager.restoreSession();
    if (!session || !session.sessionKey) {
      alert('로그인이 필요합니다. 먼저 KIS 인증을 진행해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = orderType === 'buy' ? '/api/kis/buy' : '/api/kis/sell';

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${session.sessionKey}`
        },
        body: JSON.stringify({
          stockName: stockInput,
          quantity: parseInt(quantity),
          orderCondition: orderCondition,
          price: orderCondition === 'limit' ? parseInt(price) : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`${orderType === 'buy' ? '매수' : '매도'} 주문이 성공적으로 처리되었습니다.\n${result.message}`);
        // 주문 성공 시 입력 필드 초기화
        setQuantity('');
        setPrice('');
      } else {
        alert(`${orderType === 'buy' ? '매수' : '매도'} 주문 실패: ${result.message}`);
      }

    } catch (error) {
      console.error(`${orderType === 'buy' ? '매수' : '매도'} 주문 실패:`, error);
      alert(`${orderType === 'buy' ? '매수' : '매도'} 주문 처리 중 오류가 발생했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    setShowConfirmation(false);
    if (pendingOrderType) {
      await executeOrder(pendingOrderType);
      setPendingOrderType(null);
    }
  };

  const handleCancelOrder = () => {
    setShowConfirmation(false);
    setPendingOrderType(null);
  };

  return (
    <>
      <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
        <h4 className="text-sm font-medium text-gray-100 mb-3">매수/매도</h4>

        <div className="space-y-4">
          {/* 종목 입력 */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">종목명</label>
            <input
              type="text"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="종목명 입력"
            />
          </div>

          {/* 주문구분 */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">주문구분</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setOrderCondition('market')}
                className={`flex-1 px-3 py-2 rounded-xl text-sm transition-colors ${
                  orderCondition === 'market'
                    ? 'bg-blue-600/50 text-white border border-blue-500/50'
                    : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-800/70 border border-zinc-600/30'
                }`}
              >
                시장가
              </button>
              <button
                onClick={() => setOrderCondition('limit')}
                className={`flex-1 px-3 py-2 rounded-xl text-sm transition-colors ${
                  orderCondition === 'limit'
                    ? 'bg-blue-600/50 text-white border border-blue-500/50'
                    : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-800/70 border border-zinc-600/30'
                }`}
              >
                지정가
              </button>
            </div>
          </div>

          {/* 수량 입력 */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">수량</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="주문 수량"
              min="1"
            />
          </div>

          {/* 가격 입력 (지정가일 때만) */}
          {orderCondition === 'limit' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">가격</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="주문 가격"
                min="1"
              />
            </div>
          )}

          {/* 총 금액 표시 (지정가일 때만) */}
          {orderCondition === 'limit' && price && quantity && (
            <div className="bg-zinc-800/30 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">총 주문금액</span>
                <span className="text-lg font-bold text-white">
                  {(parseInt(price) * parseInt(quantity)).toLocaleString()}원
                </span>
              </div>
            </div>
          )}

          {/* 매수/매도 버튼 */}
          <div className="flex space-x-2">
            <button
              onClick={handleBuyClick}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-red-600/50 hover:bg-red-600/70 disabled:bg-red-600/30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
            >
              {isLoading && pendingOrderType === 'buy' ? '처리중...' : '매수'}
            </button>
            <button
              onClick={handleSellClick}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600/50 hover:bg-blue-600/70 disabled:bg-blue-600/30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
            >
              {isLoading && pendingOrderType === 'sell' ? '처리중...' : '매도'}
            </button>
          </div>
        </div>
      </div>

      {/* 주문 확인 창 */}
      <OrderConfirmation
        isOpen={showConfirmation}
        orderType={pendingOrderType || 'buy'}
        stockName={stockInput}
        quantity={quantity}
        orderCondition={orderCondition}
        price={price}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelOrder}
      />
    </>
  );
}
