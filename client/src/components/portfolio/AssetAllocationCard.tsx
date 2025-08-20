// client/src/components/portfolio/AssetAllocationCard.tsx

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface AssetData {
  name: string;
  value: number;
  color: string;
}

export function AssetAllocationCard() {
  const assetData: AssetData[] = [
    { name: '주식', value: 82.5, color: '#3B82F6' },
    { name: '현금', value: 17.5, color: '#EF4444' }
  ];

  // 커스텀 라벨 렌더러
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">자산 배분</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={assetData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
            >
              {assetData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="flex justify-center space-x-6 mt-4">
        {assetData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-bold text-gray-300">{item.name}</span>
            <span className="text-sm font-bold text-white">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
