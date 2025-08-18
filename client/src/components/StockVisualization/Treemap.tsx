import { useEffect, useState } from 'react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import stockApi from '../../apis/stock';
import { StockOverviewResponse } from '../../models/Stock';

const StockTreemap = () => {
  const [stockData, setStockData] = useState<StockOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 투명도 설정 (0-100)
  const opacity = 80; // 50% 투명도

  useEffect(() => {
    const fetchTopStocks = async () => {
      try {
        setLoading(true);
        const result = await stockApi.getTopStocks();
        setStockData(result);
      } catch (err) {
        setError('주식 데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch top stocks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopStocks();
  }, []);

  // 투명도를 16진수로 변환 (0-100 -> 00-FF)
  const getOpacityHex = () => {
    const hexValue = Math.round((opacity / 100) * 255).toString(16).padStart(2, '0');
    return hexValue;
  };

  // 등락률에 따른 색상 진하기 계산
  const getColorByChangeRate = (changeRate: number) => {
    const absRate = Math.abs(changeRate);
    const opacityHex = getOpacityHex();
    
    if (changeRate >= 0) {
      // 상승: 빨간색 계열 (진하기에 따라)
      if (absRate >= 5) return `#991B1B${opacityHex}`; // 매우 진한 빨강 (5% 이상)
      if (absRate >= 3) return `#DC2626${opacityHex}`; // 진한 빨강 (3-5%)
      if (absRate >= 1) return `#EF4444${opacityHex}`; // 중간 빨강 (1-3%)
      return `#F87171${opacityHex}`; // 연한 빨강 (1% 미만)
    } else {
      // 하락: 파란색 계열 (진하기에 따라)
      if (absRate >= 5) return `#1E40AF${opacityHex}`; // 매우 진한 파랑 (5% 이상)
      if (absRate >= 3) return `#2563EB${opacityHex}`; // 진한 파랑 (3-5%)
      if (absRate >= 1) return `#3B82F6${opacityHex}`; // 중간 파랑 (1-3%)
      return `#60A5FA${opacityHex}`; // 연한 파랑 (1% 미만)
    }
  };

  // 시가총액 기준으로 트리맵 데이터 변환
  const getTreemapData = () => {
    if (!stockData?.stocks) return [];

    return stockData.stocks.map(stock => ({
      name: stock.stockName,
      size: stock.marketCap, // 시가총액 기준
      color: getColorByChangeRate(stock.changeRate), // 등락률에 따른 색상 진하기
      change: `${stock.changeRate >= 0 ? '+' : ''}${stock.changeRate.toFixed(2)}%`,
      changeRate: stock.changeRate,
      stockCode: stock.stockCode
    }));
  };

  const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, colors, name, size, change, changeRate } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: depth < 2 ? props.color : '#ffffff',
            stroke: 'rgba(23, 17, 16, 0.3)',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {width > 60 && height > 40 ? (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={11}
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={10}
              fontWeight="500"
            >
              {change}
            </text>
          </>
        ) : width > 40 && height > 25 ? (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            fontWeight="bold"
          >
            {name}
          </text>
        ) : null}
      </g>
    );
  };

  if (loading) {
    return (
      <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
        <h4 className="text-base font-medium mb-3 text-gray-100">시가총액 기준 주식 분포</h4>
        <div className="h-48 w-full flex items-center justify-center">
          <div className="text-sm text-gray-400">주식 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
        <h4 className="text-base font-medium mb-3 text-gray-100">시가총액 기준 주식 분포</h4>
        <div className="h-48 w-full flex items-center justify-center">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  const treemapData = getTreemapData();

  return (
    <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
      <h4 className="text-base font-medium mb-3 text-gray-100">시가총액 기준 주식 분포</h4>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"    
            isAnimationActive={false}
            content={<CustomizedContent />}
          >
            <Tooltip
              formatter={(value, name, props) => [
                `시가총액: ${(Number(value) / 1000000).toFixed(1)}조원`,
                props.payload.name
              ]}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '8px'
              }}
              itemStyle={{ color: '#E2E8F0' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockTreemap;
