// client/src/components/portfolio/AssetAllocationCard.tsx
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getPortfolioData, type PortfolioData } from '../../apis/portfolio';

interface AssetAllocation {
  name: string;
  value: number;
  color: string;
  percentage: number;
  stockCode?: string;
}

export function AssetAllocationCard() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 포트폴리오 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPortfolioData();
        setPortfolioData(data);
      } catch (err: any) {
        console.error('자산 배분 데이터 로딩 실패:', err);
        setError(err.message || '데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 자산 배분 데이터 계산 (주식 종목별 + 현금)
  const calculateAssetAllocation = (): AssetAllocation[] => {
    if (!portfolioData || !portfolioData.output1 || !portfolioData.output2 || portfolioData.output2.length === 0) {
      return [];
    }

    const stockHoldings = portfolioData.output1;
    const accountInfo = portfolioData.output2[0];

    // 현금 정보
    const cashAmount = parseInt(accountInfo.dnca_tot_amt || '0'); // 예수금총금액

    // 주식별 평가금액 (현금 색상과 겹치지 않도록 인덱스 1부터 시작)
    const stockAllocations = stockHoldings.map((stock, index) => {
      const value = parseInt(stock.evlu_amt || '0');
      return {
        name: stock.prdt_name,
        value: value,
        color: getStockColor(index + 1), // 현금 색상과 겹치지 않도록 +1
        stockCode: stock.pdno
      };
    });

    // 전체 자산 = 현금 + 모든 주식 평가금액
    const totalStockValue = stockAllocations.reduce((sum, stock) => sum + stock.value, 0);
    const totalAssets = cashAmount + totalStockValue;

    if (totalAssets === 0) {
      return [];
    }

    // 각 자산의 비중 계산
    const allAssets = [
      // 현금 추가 (첫 번째 색상 사용)
      {
        name: '현금',
        value: cashAmount,
        color: getStockColor(0), // 첫 번째 색상을 현금 전용으로 사용
        percentage: (cashAmount / totalAssets) * 100,
        stockCode: 'CASH'
      },
      // 주식들 추가
      ...stockAllocations.map(stock => ({
        ...stock,
        percentage: (stock.value / totalAssets) * 100
      }))
    ];

    // 비중 기준으로 정렬 (높은 순)
    allAssets.sort((a, b) => b.percentage - a.percentage);

    // 5% 이하 주식들을 "기타 주식"으로 집계 (현금은 제외)
    const majorAssets = allAssets.filter(asset => asset.percentage >= 5 || asset.stockCode === 'CASH');
    const minorStocks = allAssets.filter(asset => asset.percentage < 5 && asset.stockCode !== 'CASH');

    const result = [...majorAssets];

    // 5% 이하 주식들이 있으면 "기타 주식"으로 집계
    if (minorStocks.length > 0) {
      const otherTotalValue = minorStocks.reduce((sum, stock) => sum + stock.value, 0);
      const otherTotalPercentage = minorStocks.reduce((sum, stock) => sum + stock.percentage, 0);

      result.push({
        name: `기타 주식 (${minorStocks.length}개 종목)`,
        value: otherTotalValue,
        color: '#94a3b8', // 더 밝은 회색 (slate-400)
        percentage: otherTotalPercentage,
        stockCode: 'ETC'
      });
    }

    return result;
  };

  // 색상 팔레트 - 현금과 주식 전용 색상으로 구성
  const getStockColor = (index: number): string => {
    const colors = [
      '#10b981', // 현금 전용 - 에메랄드 그린
      '#3b82f6', // 주식 - 파란색
      '#ef4444', // 주식 - 빨간색
      '#f59e0b', // 주식 - 노란색
      '#8b5cf6', // 주식 - 보라색
      '#06b6d4', // 주식 - 청록색
      '#f97316', // 주식 - 주황색
      '#84cc16', // 주식 - 라임색
      '#ec4899', // 주식 - 핑크색
      '#14b8a6', // 주식 - 틸색
      '#f472b6', // 주식 - 장미색
      '#a78bfa', // 주식 - 라벤더색
      '#94a3b8', // 기타 주식용 - 밝은 회색 (slate-400)
    ];
    return colors[index % colors.length];
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-gray-300">
            {data.value.toLocaleString()}원 ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const assetAllocation = calculateAssetAllocation();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
        <h3 className="text-lg font-semibold text-white mb-4">자산 배분</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-32 h-32 bg-zinc-700 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-zinc-700 rounded w-24 mx-auto"></div>
            </div>
            <div className="text-sm text-gray-400 mt-4">데이터 로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || assetAllocation.length === 0) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
        <h3 className="text-lg font-semibold text-white mb-4">자산 배분</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm">
              {error || '보유 주식 데이터가 없습니다.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">자산 배분</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={assetAllocation}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {assetAllocation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 - 컴팩트 리스트 형태 */}
      <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
        {assetAllocation.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-white font-medium truncate">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="text-gray-300">
                {item.value.toLocaleString()}원
              </span>
              <span className="text-white font-semibold w-12">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
