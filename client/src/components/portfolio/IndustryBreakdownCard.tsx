// client/src/components/portfolio/IndustryBreakdownCard.tsx

interface IndustryData {
  name: string;
  percentage: number;
  color: string;
}

export function IndustryBreakdownCard() {
  const industryData: IndustryData[] = [
    { name: '반도체', percentage: 35.2, color: '#3B82F6' },
    { name: '배터리', percentage: 22.8, color: '#10B981' },
    { name: '화학', percentage: 15.5, color: '#F59E0B' },
    { name: '자동차', percentage: 12.3, color: '#EF4444' },
    { name: '바이오', percentage: 8.7, color: '#8B5CF6' },
    { name: '게임', percentage: 5.5, color: '#06B6D4' }
  ];

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">산업별 보유 비중</h3>
      
      <div className="space-y-4">
        {industryData.map((industry, index) => (
          <div key={index} className="space-y-2">
            {/* 산업명과 비중 */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">
                {industry.name}
              </span>
              <span className="text-sm font-semibold text-blue-400">
                {industry.percentage}%
              </span>
            </div>
            
            {/* 프로그레스 바 */}
            <div className="w-full bg-zinc-700/50 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${industry.percentage}%`,
                  backgroundColor: industry.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 총합 표시 */}
      <div className="mt-4 pt-4 border-t border-zinc-700/50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-400">총합</span>
          <span className="text-sm font-semibold text-white">
            {industryData.reduce((sum, industry) => sum + industry.percentage, 0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
