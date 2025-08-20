// client/src/components/portfolio/AIInsightCard.tsx

import { Brain, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface AIInsight {
  type: 'positive' | 'neutral' | 'warning';
  title: string;
  description: string;
  action?: string;
}

export function AIInsightCard() {
  const insights: AIInsight[] = [
    {
      type: 'positive',
      title: '포트폴리오 다각화 우수',
      description: '6개 산업에 걸쳐 분산투자가 잘 이루어져 있어 리스크 관리가 효과적입니다.',
    },
    {
      type: 'warning',
      title: '반도체 비중 과다',
      description: '반도체 섹터가 35.2%로 높은 비중을 차지하고 있어 섹터 리스크에 주의가 필요합니다.',
      action: '일부 매도 고려'
    },
    {
      type: 'neutral',
      title: '배당 수익률 개선 가능',
      description: '현재 2.8%의 배당 수익률을 배당주 추가 매수로 3.5% 이상 개선할 수 있습니다.',
      action: '배당주 매수 검토'
    }
  ];

  const recommendations = [
    {
      action: '추천',
      stock: 'SK텔레콤',
      reason: '안정적 배당 + 통신주 다각화',
      confidence: 85
    },
    {
      action: '매도',
      stock: 'LG에너지솔루션',
      reason: '단기 과열 + 비중 조절',
      confidence: 72
    },
    {
      action: '관심',
      stock: '카카오',
      reason: 'IT 플랫폼 저평가 구간',
      confidence: 68
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Target className="w-5 h-5 text-blue-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-500/30 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-700/30">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-6 h-6 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">AI 포트폴리오 분석</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI 인사이트 */}
        <div>
          <h4 className="text-md font-medium text-gray-300 mb-4">투자 인사이트</h4>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-white text-sm mb-1">
                      {insight.title}
                    </h5>
                    <p className="text-xs text-gray-400 mb-2">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <div className="text-xs">
                        <span className="text-gray-500">권장 액션: </span>
                        <span className="text-blue-400 font-medium">
                          {insight.action}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 추천 */}
        <div>
          <h4 className="text-md font-medium text-gray-300 mb-4">AI 매매 추천</h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      rec.action === '추천' ? 'bg-green-500/20 text-green-400' :
                      rec.action === '매도' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {rec.action}
                    </span>
                    <span className="font-medium text-white text-sm">
                      {rec.stock}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">신뢰도</div>
                    <div className="text-sm font-medium text-white">
                      {rec.confidence}%
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {rec.reason}
                </p>
                
                {/* 신뢰도 바 */}
                <div className="mt-2">
                  <div className="w-full bg-zinc-600/50 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${
                        rec.confidence >= 80 ? 'bg-green-400' :
                        rec.confidence >= 70 ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`}
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 전체 포트폴리오 점수 */}
      <div className="mt-6 pt-6 border-t border-zinc-700/50">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">포트폴리오 건강도</div>
          <div className="flex items-center justify-center space-x-4">
            <div className="text-3xl font-bold text-green-400">82</div>
            <div className="text-sm text-gray-400">/ 100</div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            양호한 수준의 포트폴리오입니다
          </div>
        </div>
      </div>
    </div>
  );
}
