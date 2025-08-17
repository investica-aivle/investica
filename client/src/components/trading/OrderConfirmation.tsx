interface OrderConfirmationProps {
  isOpen: boolean;
  orderType: 'buy' | 'sell';
  stockName: string;
  quantity: string;
  orderCondition: 'market' | 'limit';
  price?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OrderConfirmation({
  isOpen,
  orderType,
  stockName,
  quantity,
  orderCondition,
  price,
  onConfirm,
  onCancel
}: OrderConfirmationProps) {
  if (!isOpen) return null;

  const totalPrice = orderCondition === 'limit' && price
    ? parseInt(price) * parseInt(quantity)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-zinc-600/30">
        <h3 className="text-lg font-bold text-white mb-4">
          {orderType === 'buy' ? '매수' : '매도'} 주문 확인
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">종목명:</span>
            <span className="text-white font-medium">{stockName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">수량:</span>
            <span className="text-white font-medium">{parseInt(quantity).toLocaleString()}주</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">주문구분:</span>
            <span className="text-white font-medium">
              {orderCondition === 'market' ? '시장가' : '지정가'}
            </span>
          </div>

          {orderCondition === 'limit' && price && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">주문가격:</span>
                <span className="text-white font-medium">{parseInt(price).toLocaleString()}원</span>
              </div>

              <div className="flex justify-between border-t border-zinc-600/30 pt-3">
                <span className="text-gray-400">총 주문금액:</span>
                <span className="text-white font-bold text-lg">
                  {totalPrice?.toLocaleString()}원
                </span>
              </div>
            </>
          )}

          {orderCondition === 'market' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-400 text-sm">
                시장가 주문은 현재 시장가격으로 즉시 체결됩니다.
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors ${
              orderType === 'buy'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {orderType === 'buy' ? '매수' : '매도'} 주문
          </button>
        </div>
      </div>
    </div>
  );
}
