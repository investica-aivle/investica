import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const KospiOverview = () => {
  // Sample data for the KOSPI chart
  const data = [
    { date: '1월', kospi: 2400 },
    { date: '2월', kospi: 2450 },
    { date: '3월', kospi: 2480 },
    { date: '4월', kospi: 2520 },
    { date: '5월', kospi: 2500 },
    { date: '6월', kospi: 2550 },
    { date: '7월', kospi: 2600 },
    { date: '8월', kospi: 2580 },
    { date: '9월', kospi: 2620 }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg text-gray-100">코스피 현황</h3>
      <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-xs text-gray-400">코스피</div>
            <div className="text-xl font-bold text-gray-100">2,620.32</div>
          </div>
          <div className="text-green-400 text-right">
            <div className="text-sm font-medium">+15.21</div>
            <div className="text-xs">+0.58%</div>
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9CA3AF' }}
                stroke="#4B5563"
              />
              <YAxis 
                domain={['dataMin - 50', 'dataMax + 50']}
                tick={{ fill: '#9CA3AF' }}
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
        </div>
      </div>
      
      <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
        <h4 className="text-sm font-medium mb-3 text-gray-100">증권사 보고서 요약</h4>
        <div className="space-y-3">
          <div className="p-3 bg-zinc-800/30 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-blue-300">삼성증권</span>
              <span className="text-xs text-gray-400">2023.09.15</span>
            </div>
            <p className="text-sm text-gray-100">
              하반기 코스피 상승세 예상. 반도체 업황 회복과 수출 증가로 2,800선 돌파 가능성.
            </p>
          </div>
          <div className="p-3 bg-zinc-800/30 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-blue-300">미래에셋증권</span>
              <span className="text-xs text-gray-400">2023.09.14</span>
            </div>
            <p className="text-sm text-gray-100">
              글로벌 금리 인하 기대감으로 투자심리 개선. 기술주 중심 상승 예상.
            </p>
          </div>
          <div className="p-3 bg-zinc-800/30 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-blue-300">NH투자증권</span>
              <span className="text-xs text-gray-400">2023.09.12</span>
            </div>
            <p className="text-sm text-gray-100">
              원화 강세로 외국인 자금 유입 지속. 수출 의존도 높은 기업 중심 매수 추천.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KospiOverview;
