import { BrainIcon, DollarSignIcon, NewspaperIcon, PieChartIcon, TrendingUpIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import tabs, { TabType } from '../../constant/tabs';
import { useAgenticaRpc } from '../../provider/AgenticaRpcProvider';
import NewsPanel from '../news/NewsPanel';
import KospiOverview from '../StockVisualization/KospiOverview';
import { TradingTab } from '../trading/TradingTab.tsx';

export function SideContainer({ setShowSideContainer }: { setShowSideContainer: (show: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.PORTFOLIO);
  const { news, isConnected } = useAgenticaRpc();
  const onClose = () => {
    setShowSideContainer(false);
  };

  const iconMap = {
    [TabType.PORTFOLIO]: <PieChartIcon className="w-5 h-5" />,
    [TabType.KOSPI]: <TrendingUpIcon className="w-5 h-5" />,
    [TabType.NEWS]: <NewspaperIcon className="w-5 h-5" />,
    [TabType.TRADING]: <DollarSignIcon className="w-5 h-5" />,
    [TabType.AI]: <BrainIcon className="w-5 h-5" />
  };

  const tabItems = Object.entries(tabs).map(([id, tab]) => ({
    id,
    name: tab.description,
    icon: iconMap[id as TabType]
  }));

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
        {tabItems.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 py-2 px-1 text-xs flex flex-col items-center justify-center ${
              activeTab === tab.id 
                ? 'text-white border-b-2 border-white/50' 
                : 'text-gray-400 hover:bg-zinc-700/30'
            }`}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            {tab.icon}
            <span className="mt-1">{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === TabType.PORTFOLIO && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg text-gray-100">내 포트폴리오</h3>
            <div className="mt-6 bg-zinc-700/30 rounded-2xl p-4 backdrop-blur-md">
              <h4 className="font-medium mb-2 text-gray-100">포트폴리오 요약</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">총 자산:</div>
                <div className="text-right font-medium text-gray-100">₩12,450,000</div>
                <div className="text-gray-400">일간 수익률:</div>
                <div className="text-right font-medium text-green-400">+2.3%</div>
                <div className="text-gray-400">총 수익률:</div>
                <div className="text-right font-medium text-red-400">-4.2%</div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === TabType.KOSPI && <KospiOverview />}
        
        {activeTab === TabType.NEWS && (
          <NewsPanel
            company={news.company}
            items={news.items}
            fetchedAt={news.fetchedAt ?? undefined}
            loading={!news.hasFirstPush || !isConnected}
          />
        )}
        
        {activeTab === TabType.TRADING && (
          <TradingTab />
        )}
        
        {activeTab === TabType.AI && (
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
