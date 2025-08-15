import { BrainIcon, DollarSignIcon, NewspaperIcon, PieChartIcon, TrendingUpIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import KospiOverview from '../StockVisualization/KospiOverview';
import StockTreemap from '../StockVisualization/Treemap';
import { TradingTab } from '../trading/TradingTab.tsx';

export function SideContainer({ setShowSideContainer }: { setShowSideContainer: (show: boolean) => void }) {
  const [activeTab, setActiveTab] = useState('portfolio');
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
      <div className="flex justify-between items-center p-4 border-b border-zinc-700/30">
        <h2 className="font-bold text-lg text-gray-100">주식 대시보드</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-xl hover:bg-zinc-700/50 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex border-b border-zinc-700/30">
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
      
      <div className="overflow-y-auto p-4">
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg text-gray-100">내 포트폴리오</h3>
            <StockTreemap />
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
        
        {activeTab === 'news' && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg text-gray-100">주요 뉴스</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-700/30 p-3 rounded-2xl backdrop-blur-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-blue-300">삼성전자</span>
                    <span className="text-xs bg-green-800/50 text-green-200 px-2 py-0.5 rounded-full">
                      긍정
                    </span>
                  </div>
                  <h4 className="text-sm font-medium mb-1 text-gray-100">
                    삼성전자, 신형 반도체 생산라인 확장 계획 발표
                  </h4>
                  <p className="text-xs text-gray-400">
                    2023년 하반기 매출 상승세 전망. 반도체 시장 점유율 확대 예상...
                  </p>
                </div>
              ))}
              {[1, 2].map(i => (
                <div key={i} className="bg-zinc-700/30 p-3 rounded-2xl backdrop-blur-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-blue-300">현대차</span>
                    <span className="text-xs bg-red-900/50 text-red-200 px-2 py-0.5 rounded-full">
                      부정
                    </span>
                  </div>
                  <h4 className="text-sm font-medium mb-1 text-gray-100">
                    현대차, 글로벌 공급망 이슈로 생산 차질 예상
                  </h4>
                  <p className="text-xs text-gray-400">
                    원자재 가격 상승과 공급망 문제로 3분기 생산량 감소 전망...
                  </p>
                </div>
              ))}
            </div>
          </div>
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
