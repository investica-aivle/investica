import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SessionManager } from '../../utils/sessionManager';
import { StockSearchInput } from './StockSearchInput';

interface TargetStock {
  symbol: string;
  name: string;
}

interface PriceSectionProps {
  targetStock: TargetStock | null;
  onStockSelect: (stock: TargetStock) => void;
}

interface ChartData {
  date: string;
  price: number;
}

interface StockInfo {
  currentPrice: number;
  change: number;
  changePercent: number;
}

export function PriceSection({ targetStock, onStockSelect }: PriceSectionProps) {
  const [searchValue, setSearchValue] = useState('');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [periodCode, setPeriodCode] = useState<'D' | 'W' | 'M'>('D');

  // 주요 종목 목록
  const popularStocks = [
    { symbol: '005930', name: '삼성전자' },
    { symbol: '000660', name: 'SK하이닉스' },
    { symbol: '035420', name: 'NAVER' },
    { symbol: '051910', name: 'LG화학' },
  ];

  // 컴포넌트 초기 로드 시 기본 주식(삼성전자) 설정
  useEffect(() => {
    if (!targetStock) {
      const defaultStock = { symbol: '005930', name: '삼성전자' };
      onStockSelect(defaultStock);
      setSearchValue(defaultStock.name);
    }
  }, []);

  // 타겟 주식이나 기간이 변경될 때 차트 데이터 로드
  useEffect(() => {
    if (targetStock) {
      fetchChartData(targetStock.name);
    }
  }, [targetStock, periodCode]);

  const fetchChartData = async (stockName: string) => {
    setIsLoading(true);
    try {
      const session = SessionManager.restoreSession();
      if (!session || !session.sessionKey) {
        console.error('인증 세션이 없습니다.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/kis/daily-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${session.sessionKey}`
        },
        body: JSON.stringify({
          stockName: stockName,
          periodCode: periodCode
        })
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const result = await response.json();

      // API 응답 데이터를 차트 형식으로 변환 (날짜 형식 개선)
      const chartData: ChartData[] = result.data.map((item: any) => {
        const dateStr = item.stck_bsop_date || item['주식 영업 일자'];
        let formattedDate = '';

        // 날짜 형식 처리 (YYYYMMDD -> YYYY-MM-DD)
        if (dateStr && dateStr.length === 8) {
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          formattedDate = `${year}-${month}-${day}`;
        } else {
          formattedDate = dateStr;
        }

        return {
          date: formattedDate,
          price: parseInt(item.stck_clpr || item['주식 종가']) || 0
        };
      }).reverse();

      setChartData(chartData);

      if (result.data && result.data.length > 0) {
        const latestData = result.data[0];
        const currentPrice = parseInt(latestData.stck_clpr || latestData['주식 종가'] || '0');
        const change = parseInt(latestData.prdy_vrss || latestData['전일 대비'] || '0');
        const changePercent = parseFloat(latestData.prdy_ctrt || latestData['전일 대비율'] || '0');

        setStockInfo({
          currentPrice,
          change,
          changePercent
        });
      } else {
        setStockInfo(null);
      }
    } catch (error) {
      console.error('차트 데이터 로드 실패:', error);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockButtonClick = (stock: TargetStock) => {
    onStockSelect(stock);
    setSearchValue(stock.name);
  };

  const handleStockSearch = (selectedStock: { code: string; name: string }) => {
    const stock: TargetStock = {
      symbol: selectedStock.code,
      name: selectedStock.name
    };
    onStockSelect(stock);
  };

  const handleSearchButtonClick = () => {
    if (searchValue.trim()) {
      const foundStock = popularStocks.find(stock =>
        stock.name.includes(searchValue) || stock.symbol.includes(searchValue)
      );

      if (foundStock) {
        onStockSelect(foundStock);
      } else {
        onStockSelect({ symbol: '', name: searchValue });
      }
    }
  };

  return (
    <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-100">실시간 시세</h4>

        {targetStock && (
          <div className="flex space-x-1">
            {[
              { code: 'D' as const, label: '일' },
              { code: 'W' as const, label: '주' },
              { code: 'M' as const, label: '월' }
            ].map((period) => (
              <button
                key={period.code}
                onClick={() => setPeriodCode(period.code)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  periodCode === period.code
                    ? 'bg-blue-600/50 text-white border border-blue-500/50'
                    : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-800/70 border border-zinc-600/30'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 종목 검색 with 자동완성 */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            종목 조회
          </label>
          <div className="flex space-x-2">
            <StockSearchInput
              value={searchValue}
              onChange={setSearchValue}
              onStockSelect={handleStockSearch}
              placeholder="종목명 또는 코드 입력"
            />
            <button
              onClick={handleSearchButtonClick}
              className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600/70 text-white rounded-xl text-sm transition-colors"
            >
              검색
            </button>
          </div>
        </div>

        {/* 인기 종목 버튼들 */}
        <div className="flex flex-wrap gap-2">
          {popularStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleStockButtonClick(stock)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                targetStock?.symbol === stock.symbol
                  ? 'bg-blue-600/50 text-white'
                  : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-800/70'
              }`}
            >
              {stock.name}
            </button>
          ))}
        </div>

        {/* 현재 주가 정보 */}
        {targetStock && stockInfo && (
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <h5 className="text-sm font-medium text-gray-100">
                {targetStock.name} {targetStock.symbol && `(${targetStock.symbol})`}
              </h5>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold text-white">
                  {stockInfo.currentPrice.toLocaleString()}원
                </span>
                <div className={`flex items-center space-x-1 ${
                  stockInfo.change > 0 ? 'text-red-400' : 
                  stockInfo.change < 0 ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  <span className="text-sm">
                    {stockInfo.change > 0 ? '+' : ''}{stockInfo.change.toLocaleString()}
                  </span>
                  <span className="text-sm">
                    ({stockInfo.change > 0 ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 차트 영역 */}
        {targetStock && (
          <div className="bg-zinc-800/30 rounded-xl p-3">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">데이터 로딩 중...</p>
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('ko-KR');
                      }}
                      formatter={(value: number) => [
                        `${value.toLocaleString()}원`,
                        '종가'
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-gray-400">차트 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
