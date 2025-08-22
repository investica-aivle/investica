import { useEffect, useState } from 'react';
import reportsApi from '../../apis/reports';
import { Keyword, KeywordSummaryResult } from '../../models/Reports';

const KeywordSummary = () => {
  const [keywordData, setKeywordData] = useState<KeywordSummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeywordSummary = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getKeywordSummary();
        setKeywordData(result);
      } catch (err) {
        setError('키워드 요약을 불러오는데 실패했습니다.');
        console.error('Failed to fetch keyword summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKeywordSummary();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      case 'neutral':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getImpactBgColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'bg-green-500/20';
      case 'negative':
        return 'bg-red-500/20';
      case 'neutral':
        return 'bg-yellow-500/20';
      default:
        return 'bg-zinc-800/30';
    }
  };

  return (
    <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
      <h4 className="text-base font-medium mb-3 text-gray-100">시장 키워드 요약</h4>
      {loading && (
        <div className="text-center py-4">
          <div className="text-sm text-gray-400">키워드를 불러오는 중...</div>
        </div>
      )}
      {error && (
        <div className="text-center py-4">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}
      {keywordData && keywordData.keywords && (
        <div className="space-y-3">
          {keywordData.keywords?.map((keyword: Keyword, index: number) => (
            <div key={index} className={`px-4 py-2 rounded-xl ${getImpactBgColor(keyword.impact)}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg">{keyword.icon}</span>
                <span className={`text-sm font-semibold ${getImpactColor(keyword.impact)}`}>
                  {keyword.keyword}
                </span>
              </div>
              <p className="text-sm text-gray-100 leading-relaxed">
                {keyword.description}
              </p>
            </div>
          ))}
          {keywordData.referencedFiles?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-600/30">
              <div className="text-xs text-gray-400 mb-2">참조 보고서</div>
              <div className="space-y-1">
                {keywordData.referencedFiles?.slice(0, 3).map((file, index) => (
                  <div key={index} className="text-xs text-gray-300 truncate">
                    • {file.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KeywordSummary;
