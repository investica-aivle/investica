import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SessionManager } from '../../utils/sessionManager';

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

  // 타겟 주식이나 기간이 변경될 때 차트 데이터 로드
  useEffect(() => {
    if (targetStock) {
      fetchChartData(targetStock.name);
    }
  }, [targetStock, periodCode]);

  const fetchChartData = async (companyName: string) => {
    setIsLoading(true);
    try {
      // 세션에서 sessionKey 가져오기
      const session = SessionManager.restoreSession();
      if (!session || !session.sessionKey) {
        console.error('인증 세션이 없습니다.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/kis/daily-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.sessionKey}`
        },
        body: JSON.stringify({
          company: companyName,
          periodCode: periodCode
        })
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const result = await response.json();

      // API 응답 디버깅용 콘솔 로그
      console.log('=== API 응답 전체 ===');
      console.log(result);
      console.log('=== 응답 데이터 타입 ===');
      console.log('result.data 타입:', typeof result.data);
      console.log('result.data 길이:', result.data?.length);
      console.log('=== 첫 번째 데이터 항목 ===');
      console.log(result.data?.[0]);
      console.log('=== 모든 키 확인 ===');
      if (result.data?.[0]) {
        console.log('첫 번째 항목의 키들:', Object.keys(result.data[0]));
      }

      // API 응답 데이터를 차트 형식으로 변환
      const chartData: ChartData[] = result.data.map((item: any) => ({
        date: item.stck_bsop_date || item['주식 영업 일자'], // API 응답에 따라 키 조정
        price: parseInt(item.stck_clpr || item['주식 종가']) // 종가 데이터
      })).reverse(); // 날짜 순으로 정렬

      console.log('=== 변환된 차트 데이터 ===');
      console.log('차트 데이터 길이:', chartData.length);
      console.log('첫 번째 차트 데이터:', chartData[0]);
      console.log('마지막 차트 데이터:', chartData[chartData.length - 1]);

      setChartData(chartData);

      // 마지막(최신) 데이터에서 전일 대비 정보 파싱
      if (result.data && result.data.length > 0) {
        const latestData = result.data[0]; // 첫 번째가 최신 데이터 (reverse 전)

        console.log('=== 최신 데이터로 전일 대비 정보 파싱 ===');
        console.log('최신 데이터:', latestData);

        // KIS API 응답에서 전일 대비 정보 추출
        const currentPrice = parseInt(latestData.stck_clpr || latestData['주식 종가'] || '0');
        const change = parseInt(latestData.prdy_vrss || latestData['전일 대비'] || '0');
        const changePercent = parseFloat(latestData.prdy_ctrt || latestData['전일 대비율'] || '0');

        console.log('파싱된 정보:', {
          currentPrice,
          change,
          changePercent
        });

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

      // 에러 발생 시 빈 배열로 설정
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockButtonClick = (stock: TargetStock) => {
    onStockSelect(stock);
    setSearchValue(stock.name);
  };

  const handleSearch = () => {
    if (searchValue.trim()) {
      // 검색어로 주식 찾기 (간단한 매칭)
      const foundStock = popularStocks.find(stock =>
        stock.name.includes(searchValue) || stock.symbol.includes(searchValue)
      );

      if (foundStock) {
        onStockSelect(foundStock);
      } else {
        // 직접 입력된 종목명으로 처리
        const newStock = { symbol: '', name: searchValue };
        onStockSelect(newStock);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
      <h4 className="text-sm font-medium mb-3 text-gray-100">실시간 시세</h4>

      <div className="space-y-4">
        {/* 종목 검색 */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            종목 조회
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="종목명 또는 코드 입력"
            />
            <button
              onClick={handleSearch}
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

        {/* 선택된 종목 정보 및 차트 */}
        {targetStock ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="font-medium text-gray-100">{targetStock.name}</h5>
                {targetStock.symbol && (
                  <p className="text-xs text-gray-400">{targetStock.symbol}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-100">
                  {isLoading ? '로딩 중...' : stockInfo ? `₩${stockInfo.currentPrice.toLocaleString()}` : '₩-'}
                </div>
                <div className="text-sm">
                  {stockInfo ? (
                    <span className={stockInfo.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {stockInfo.change >= 0 ? '+' : ''}{stockInfo.change.toLocaleString()} ({stockInfo.changePercent >= 0 ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%)
                    </span>
                  ) : '-'}
                </div>
              </div>
            </div>

            {/* 기간 선택 버튼들 */}
            <div className="flex justify-center space-x-2">
              {[
                { code: 'D' as const, label: '일' },
                { code: 'W' as const, label: '주' },
                { code: 'M' as const, label: '월' }
              ].map((period) => (
                <button
                  key={period.code}
                  onClick={() => setPeriodCode(period.code)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    periodCode === period.code
                      ? 'bg-blue-600/50 text-white border border-blue-500/50'
                      : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-800/70 border border-zinc-600/30'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* 차트 영역 */}
            <div className="h-48 w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">차트 로딩 중...</div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickLine={{ stroke: '#6B7280' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickLine={{ stroke: '#6B7280' }}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#374151',
                        border: '1px solid #6B7280',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value: number) => [`₩${value.toLocaleString()}`, '주가']}
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">차트 데이터가 없습니다</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800/30 p-3 rounded-xl">
            <div className="text-center text-gray-400 text-sm">
              종목을 검색하여 실시간 시세를 확인하세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
