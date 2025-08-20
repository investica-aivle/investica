import { BrainIcon, DollarSignIcon, NewspaperIcon, PieChartIcon, TrendingUpIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import KospiOverview from '../StockVisualization/KospiOverview';
import { useAgenticaRpc } from '../../provider/AgenticaRpcProvider';
import NewsPanel from '../news/NewsPanel';
import { TradingTab } from '../trading/TradingTab.tsx';
import AIAnalysis from "../ai/AIAnalysis.tsx";

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

            <div
                className="flex-1 overflow-y-auto p-4 custom-scrollbar"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#52525b #18181b'
                }}
            >

                {activeTab === 'portfolio' && (
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
                    <AIAnalysis />
                )}
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #52525b;
          border-radius: 4px;
          border: 1px solid #18181b;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #71717a;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #a1a1aa;
        }
      `}</style>
        </div>
    );
}