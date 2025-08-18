import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getKospiPrices } from '../../apis/stock';
import { KospiChartData, KospiPriceData } from '../../models/Stock';

type PeriodType = 'D' | 'W' | 'M' | 'Y';

const KospiChart = () => {
  const [data, setData] = useState<KospiChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('D');
  const [currentPrice, setCurrentPrice] = useState<string>('0');
  const [changeAmount, setChangeAmount] = useState<string>('0');
  const [changeRate, setChangeRate] = useState<string>('0');

  const periodLabels = {
    D: '일',
    W: '주',
    M: '월',
    Y: '년'
  };

  const fetchKospiData = async (period: PeriodType) => {
    setLoading(true);
    try {
      // 기간별 날짜 계산
      const { startDate, endDate } = calculateDateRange(period);
      
      const response = await getKospiPrices({ 
        periodCode: period,
        startDate,
        endDate
      });
      
      const chartData = response.data.map((item: KospiPriceData, index: number, array: KospiPriceData[]) => {
        const currentPrice = parseFloat(item.종가);
        const previousPrice = index < array.length - 1 ? parseFloat(array[index + 1].종가) : currentPrice;
        const changeRate = previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
        
        return {
          date: formatDate(item.기준일자, period),
          kospi: currentPrice,
          open: parseFloat(item.시가),
          high: parseFloat(item.고가),
          low: parseFloat(item.저가),
          volume: parseFloat(item.거래량),
          changeRate: changeRate
        };
      });

      setData(chartData);
      
      // 최신 데이터로 현재가 정보 업데이트
      if (chartData.length > 0) {
        const latest = chartData[0]; // 가장 최신 데이터 (배열의 첫 번째)
        const previous = chartData.length > 1 ? chartData[1] : latest; // 이전 데이터
        
        setCurrentPrice(latest.kospi.toLocaleString());
        
        const changeAmount = latest.kospi - previous.kospi;
        const changeRatePercent = ((changeAmount / previous.kospi) * 100);
        
        setChangeAmount(changeAmount > 0 ? `+${changeAmount.toFixed(2)}` : changeAmount.toFixed(2));
        setChangeRate(changeRatePercent > 0 ? `+${changeRatePercent.toFixed(2)}%` : `${changeRatePercent.toFixed(2)}%`);
      }
    } catch (error) {
      console.error('코스피 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 기간별 날짜 범위 계산
  const calculateDateRange = (period: PeriodType) => {
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD 형식
    
    let startDate: string;
    
    switch (period) {
      case 'D':
        // 일별: 1주일 전
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().slice(0, 10).replace(/-/g, '');
        break;
      case 'W':
        // 주별: 12주 전 (약 3개월)
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setDate(today.getDate() - 84);
        startDate = threeMonthsAgo.toISOString().slice(0, 10).replace(/-/g, '');
        break;
      case 'M':
        // 월별: 6개월 전
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setDate(today.getDate() - 180);
        startDate = sixMonthsAgo.toISOString().slice(0, 10).replace(/-/g, '');
        break;
      case 'Y':
        // 년별: 5년 전
        const fiveYearsAgo = new Date(today);
        fiveYearsAgo.setDate(today.getDate() - 1825);
        startDate = fiveYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');
        break;
      default:
        startDate = endDate;
    }
    
    return { startDate, endDate };
  };

  const formatDate = (dateStr: string, period: PeriodType): string => {
    // YYYYMMDD 형식을 YYYY-MM-DD 형식으로 변환
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const formattedDateStr = `${year}-${month}-${day}`;
    
    const date = new Date(formattedDateStr);
    
    switch (period) {
      case 'D':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case 'W':
        return `${date.getMonth() + 1}월 ${Math.ceil(date.getDate() / 7)}주`;
      case 'M':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'Y':
        return `${date.getFullYear()}`;
      default:
        return dateStr;
    }
  };

  useEffect(() => {
    fetchKospiData(selectedPeriod);
  }, [selectedPeriod]);

  const isPositive = parseFloat(changeAmount) > 0;

  return (
    <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs text-gray-400">코스피</div>
          <div className="text-xl font-bold text-gray-100">{currentPrice}</div>
        </div>
        <div className={`text-right ${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
          <div className="text-sm font-medium">{changeAmount}</div>
          <div className="text-xs">{changeRate}</div>
        </div>
      </div>

      {/* 기간 선택 버튼 */}
      <div className="flex gap-2 mb-4">
        {(['D', 'W', 'M', 'Y'] as PeriodType[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-600/50 text-gray-300 hover:bg-zinc-600/70'
            }`}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      <div className="h-48 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400">데이터 로딩 중...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#4B5563"
              />
              <YAxis 
                domain={['dataMin - 50', 'dataMax + 50']}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#4B5563"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#E2E8F0' }}
                formatter={(value) => [`${value}`, '코스피']}
                labelFormatter={(label) => `날짜: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="kospi" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default KospiChart;
