import React, { useState, useEffect } from 'react';
import {IndustryEvaluationSummaryResponse} from "../../types/reports.ts";
import reportsApi from "../../apis/reports.ts"

const AIAnalysis = () => {
    const [industryData, setIndustryData] = useState<IndustryEvaluationSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false); // 더보기 상태 추가
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set()); // 자세히 보기 상태 추가


    useEffect(() => {
        const fetchIndustryData = async () => {
            try {
                setLoading(true);
                const result = await reportsApi.getIndustryEvaluationSummary();
                setIndustryData(result);
            } catch (err) {
                setError('산업 분석 데이터를 불러오는데 실패했습니다.');
                console.error('Industry evaluation API 호출 실패:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchIndustryData();
    }, []);

    // 평가 코드에 따른 스타일 반환
    const getEvaluationStyle = (evaluationCode: string) => {
        const styles = {
            POSITIVE: {
                color: 'text-green-400',
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-500/30'
            },
            NEGATIVE: {
                color: 'text-red-400',
                bgColor: 'bg-red-500/20',
                borderColor: 'border-red-500/30'
            },
            NEUTRAL: {
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-500/20',
                borderColor: 'border-yellow-500/30'
            }
        };
        return styles[evaluationCode as keyof typeof styles] || styles.NEUTRAL;
    };

    // 더보기/접기 핸들러
    const handleToggleShowAll = () => {
        setShowAll(!showAll);
    };

    // 자세히 보기 토글 핸들러
    const handleToggleExpanded = (index: number) => {
        const newExpandedItems = new Set(expandedItems);
        if (newExpandedItems.has(index)) {
            newExpandedItems.delete(index);
        } else {
            newExpandedItems.add(index);
        }
        setExpandedItems(newExpandedItems);
    };

    // 공포 지수 관련 함수들
    const getFearGreedColor = (value: number) => {
        if (value <= 24) return { bg: 'from-red-600 to-red-500', text: 'text-red-400', label: '극도공포' };
        if (value <= 49) return { bg: 'from-orange-600 to-orange-500', text: 'text-orange-400', label: '공포' };
        if (value <= 74) return { bg: 'from-yellow-600 to-yellow-500', text: 'text-yellow-400', label: '경계' };
        if (value <= 89) return { bg: 'from-green-600 to-green-500', text: 'text-green-400', label: '탐욕' };
        return { bg: 'from-emerald-600 to-emerald-500', text: 'text-emerald-400', label: '극도탐욕' };
    };


    // 표시할 산업 데이터 결정
    const getDisplayedIndustries = () => {
        if (!industryData || !industryData.industryEvaluations) return [];
        return showAll ? industryData.industryEvaluations : industryData.industryEvaluations.slice(0, 4);
    };

    return (
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

            {/* 산업별 평가 분석 */}
            <div className="bg-zinc-700/30 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-base font-medium text-gray-100">AI 산업별 평가</h4>
                    {industryData && (
                        <span className="text-sm text-gray-400">
              {new Date(industryData.lastEvaluated).toLocaleDateString('ko-KR')} 업데이트
            </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="h-4 bg-zinc-600 rounded w-20"></div>
                                    <div className="h-4 bg-zinc-600 rounded w-16"></div>
                                </div>
                                <div className="h-2 bg-zinc-600 rounded mb-2"></div>
                                <div className="h-4 bg-zinc-600 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-red-400 text-sm text-center py-4">{error}</div>
                ) : industryData && industryData.industryEvaluations.length > 0 ? (
                    <div className="space-y-4">
                        {getDisplayedIndustries().map((industry, index) => {
                            const style = getEvaluationStyle(industry.evaluationCode);
                            const confidencePercentage = Math.round(industry.confidence * 100);
                            const isExpanded = expandedItems.has(index);

                            return (
                                <div
                                    key={index}
                                    className="border-b border-zinc-600/30 pb-4 last:border-b-0 last:pb-0 cursor-pointer hover:bg-zinc-600/20 rounded-lg p-3 -m-3 transition-colors"
                                    onClick={() => handleToggleExpanded(index)}
                                >
                                    {/* 산업명과 평가 */}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-base font-medium text-gray-100">{industry.industryName}</span>
                                            <span className={`${style.color} text-sm px-3 py-1 ${style.bgColor} rounded-full font-medium`}>
                        {industry.evaluation}
                      </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400">신뢰도 {confidencePercentage}%</span>
                                            <span className="text-sm text-gray-500">
                                                {isExpanded ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 신뢰도 바 */}
                                    <div className="mb-3">
                                        <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${style.color.replace('text-', 'bg-').replace('-400', '-500')}`}
                                                style={{ width: `${confidencePercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* 요약 */}
                                    <p className={`text-sm text-gray-300 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                        {industry.summary}
                                    </p>

                                    {/* 자세한 정보 (확장 시에만 표시) */}
                                    {isExpanded && (
                                        <div className="mt-4 space-y-4">
                                            {/* 주요 동력 */}
                                            {industry.keyDrivers.length > 0 && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                                                        <span>+</span>
                                                        <span>주요 동력</span>
                                                    </h5>
                                                    <ul className="space-y-2">
                                                        {industry.keyDrivers.map((driver, driverIndex) => (
                                                            <li key={driverIndex} className="text-sm text-gray-300 pl-4 relative">
                                                                <span className="absolute left-0 text-green-400">•</span>
                                                                {driver}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* 주요 리스크 */}
                                            {industry.keyRisks.length > 0 && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                                                        <span>−</span>
                                                        <span>주요 리스크</span>
                                                    </h5>
                                                    <ul className="space-y-2">
                                                        {industry.keyRisks.map((risk, riskIndex) => (
                                                            <li key={riskIndex} className="text-sm text-gray-300 pl-4 relative">
                                                                <span className="absolute left-0 text-red-400">•</span>
                                                                {risk}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* 참조한 보고서 */}
                                            {industry.referencedReports && industry.referencedReports.length > 0 && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-1">
                                                        <span>참조 보고서</span>
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {industry.referencedReports.map((report, reportIndex) => (
                                                            <div
                                                                key={reportIndex}
                                                                className="bg-zinc-800/30 rounded-lg p-3 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-sm text-gray-500 mt-0.5">#{report.id}</span>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                                            {report.title}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 주요 포인트 (간략 모드일 때만) */}
                                    {!isExpanded && (
                                        <div className="flex gap-4 mt-3 text-sm">
                                            {industry.keyDrivers.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-green-400">+</span>
                                                    <span className="text-gray-400">{industry.keyDrivers.length}개 동력</span>
                                                </div>
                                            )}
                                            {industry.keyRisks.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-red-400">−</span>
                                                    <span className="text-gray-400">{industry.keyRisks.length}개 리스크</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* 더보기/접기 버튼 */}
                        {industryData.industryEvaluations.length > 4 && (
                            <div className="text-center pt-3">
                                <button
                                    onClick={handleToggleShowAll}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {showAll
                                        ? '접기'
                                        : `+${industryData.industryEvaluations.length - 4}개 산업 더보기`
                                    }
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400 text-sm text-center py-4">
                        분석 가능한 산업 데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysis;