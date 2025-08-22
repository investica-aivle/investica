import { BrainIcon, DollarSignIcon, NewspaperIcon, PieChartIcon, TrendingUpIcon, XIcon } from 'lucide-react';
import tabs, { TabType } from '../../constant/tabs';
import { useAgenticaRpc } from '../../provider/AgenticaRpcProvider';
import AIAnalysis from "../ai/AIAnalysis.tsx";
import NewsPanel from '../news/NewsPanel';
import { AssetAllocationCard } from '../portfolio/AssetAllocationCard';
import { PortfolioHeader } from '../portfolio/PortfolioHeader';
import { StockHoldingsList } from '../portfolio/StockHoldingsList';
import KospiOverview from '../StockVisualization/KospiOverview';
import { TradingTab } from '../trading/TradingTab.tsx';

export function SideContainer({ setShowSideContainer }: { setShowSideContainer: (show: boolean) => void }) {
  const { news, isConnected, currentTab, setCurrentTab } = useAgenticaRpc();
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
        <div
            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
            style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#52525b #18181b'
            }}
        >
          <div className="flex border-b border-zinc-700/30 flex-shrink-0">
        {tabItems.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 py-2 px-1 text-xs flex flex-col items-center justify-center ${
              currentTab === tab.id 
                ? 'text-white border-b-2 border-white/50' 
                : 'text-gray-400 hover:bg-zinc-700/30'
            }`}
            onClick={() => setCurrentTab(tab.id as TabType)}
          >
            {tab.icon}
            <span className="mt-1">{tab.name}</span>
          </button>
        ))}
      </div>

          <div className="flex-1 overflow-y-auto p-4">
            {currentTab === 'portfolio' && (
              <div className="space-y-4">
                <PortfolioHeader />
                <div className="grid grid-cols-1 gap-4">
                  <AssetAllocationCard />
                  <StockHoldingsList />
                </div>
              </div>
            )}

            {currentTab === 'kospi' && <KospiOverview />}

            {currentTab === "news" && (
              <NewsPanel
                company={news.company}
                items={news.items}
                fetchedAt={news.fetchedAt ?? undefined}
                loading={!news.hasFirstPush || !isConnected}
              />
            )}

            {currentTab === 'trading' && (
              <TradingTab />
            )}

            {currentTab === 'ai' && (
              <AIAnalysis />
            )}
          </div>
        </div>
    </div>
  );
}
