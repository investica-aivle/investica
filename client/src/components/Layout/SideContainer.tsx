import { BrainIcon, DollarSignIcon, NewspaperIcon, PieChartIcon, TrendingUpIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import KospiOverview from '../StockVisualization/KospiOverview';
import StockTreemap from '../StockVisualization/Treemap';
import { useAgenticaRpc } from '../../provider/AgenticaRpcProvider';
import NewsPanel from '../news/NewsPanel';
import { TradingTab } from '../trading/TradingTab.tsx';
import { PortfolioHeader } from '../portfolio/PortfolioHeader';
import { AssetAllocationCard } from '../portfolio/AssetAllocationCard';
import { IndustryBreakdownCard } from '../portfolio/IndustryBreakdownCard';
import { StockHoldingsList } from '../portfolio/StockHoldingsList';
import { AIInsightCard } from '../portfolio/AIInsightCard';

export function SideContainer({ setShowSideContainer }: { setShowSideContainer: (show: boolean) => void }) {
  const [activeTab, setActiveTab] = useState('portfolio');
  const { news, isConnected } = useAgenticaRpc();
  const onClose = () => {
    setShowSideContainer(false);
  };


  const tabs = [
    { id: 'portfolio', name: '포트폴리오', icon: <PieChartIcon className="w-5 h-5" /> },
    { id: 'kospi', name: '코스피 현황', icon: <TrendingUpIcon className="w-5 h-5" /> },
    { id: 'news', name: '주요 뉴스', icon: <NewspaperIcon className="w-5 h-5" /> },
    { id: 'trading', name: '매매 기능', icon: <DollarSignIcon className="w-5 h-5" /> },
    { id: 'ai', name: 'AI 분석', icon: <BrainIcon className="w-5 h-5" /> }
  ];
  return (
    <div className="flex flex-1 flex-col w-80 bg-zinc-800/50 backdrop-blur-md text-white h-full border-r border-zinc-700/30">
      <div className="flex justify-between items-center p-4 border-b border-zinc-700/30 flex-shrink-0">
        <h2 className="font-bold text-lg text-gray-100">주식 대시보드</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-xl hover:bg-zinc-700/50 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex border-b border-zinc-700/30 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 py-2 px-1 text-xs flex flex-col items-center justify-center ${
              activeTab === tab.id 
                ? 'text-white border-b-2 border-white/50' 
                : 'text-gray-400 hover:bg-zinc-700/30'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span className="mt-1">{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <PortfolioHeader />
            <div className="grid grid-cols-1 gap-4">
              {/* 자산배분과 산업별 비중을 가로로 배치 */}
              <div className="grid grid-cols-2 gap-4">
                <AssetAllocationCard />
                <IndustryBreakdownCard />
              </div>
              <StockHoldingsList />
            </div>
            <AIInsightCard />
          </div>
        )}
        
        {activeTab === 'kospi' && <KospiOverview />}
        
        {activeTab === "news" && (
          <NewsPanel
            company={news.company}
            items={news.items}
            fetchedAt={news.fetchedAt ?? undefined}
            loading={!news.hasFirstPush || !isConnected}
          />
        )}
        
        {activeTab === 'trading' && (
          <TradingTab />
        )}
        
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg text-gray-100">AI 분석</h3>
            <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-100">시장 공포 지수</h4>
                <span className="text-yellow-300 text-sm font-medium">65 (경계)</span>
              </div>
              <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 w-[65%]"></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
            <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
              <h4 className="text-sm font-medium mb-3 text-gray-100">AI 종목 추천</h4>
              <div className="space-y-2">
                {[
                  { name: 'SK하이닉스', code: '000660', change: '+3.2%' },
                  { name: 'NAVER', code: '035420', change: '+1.8%' },
                  { name: 'LG화학', code: '051910', change: '+2.5%' }
                ].map(stock => (
                  <div key={stock.code} className="flex justify-between items-center p-2 hover:bg-zinc-800/30 rounded-xl transition-colors">
                    <div>
                      <div className="font-medium text-sm text-gray-100">{stock.name}</div>
                      <div className="text-xs text-gray-400">{stock.code}</div>
                    </div>
                    <div className="text-green-400">{stock.change}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
