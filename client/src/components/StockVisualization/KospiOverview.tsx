import KeywordSummary from './KeywordSummary';
import KospiChart from './KospiChart';
import StockTreemap from './Treemap';

const KospiOverview = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg text-gray-100">코스피 현황</h3>
      <KospiChart />
      <StockTreemap />
      <KeywordSummary />
    </div>
  );
};

export default KospiOverview;
