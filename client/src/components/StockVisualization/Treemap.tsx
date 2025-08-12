import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';

const StockTreemap = () => {
  // Sample data for the treemap
  const data = [
    { name: '삼성전자', size: 30, color: '#3182CE', change: '+1.2%' },
    { name: 'SK하이닉스', size: 15, color: '#4299E1', change: '+2.5%' },
    { name: '현대차', size: 12, color: '#63B3ED', change: '-0.8%' },
    { name: 'NAVER', size: 10, color: '#90CDF4', change: '+1.5%' },
    { name: '카카오', size: 8, color: '#BEE3F8', change: '-1.2%' },
    { name: 'LG화학', size: 7, color: '#2B6CB0', change: '+3.2%' },
    { name: '셀트리온', size: 6, color: '#2C5282', change: '-0.5%' },
    { name: '기타', size: 12, color: '#1A365D', change: '0.0%' }
  ];

  const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, colors, name, size, change } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: depth < 2 ? props.color : '#ffffff',
            stroke: '#fff',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {width > 50 && height > 30 ? (
          <text
            x={x + width / 2}
            y={y + height / 2 - 7}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
        ) : null}
        {width > 50 && height > 30 ? (
          <text
            x={x + width / 2}
            y={y + height / 2 + 7}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
          >
            {change}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <div className="h-64 w-full bg-zinc-700/30 rounded-2xl p-2 backdrop-blur-md">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          stroke="#fff"
          fill="#8884d8"
          isAnimationActive={false}
          content={<CustomizedContent />}
        >
          <Tooltip
            formatter={(value, name) => [`비중: ${value}%`, name]}
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
  );
};

export default StockTreemap;
