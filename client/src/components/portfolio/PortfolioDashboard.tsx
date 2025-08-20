// // client/src/components/portfolio/PortfolioDashboard.tsx
//
// import { PortfolioHeader } from './PortfolioHeader';
// import { AssetAllocationCard } from './AssetAllocationCard';
// import { IndustryBreakdownCard } from './IndustryBreakdownCard';
// import { StockHoldingsList } from './StockHoldingsList';
// import { AIInsightCard } from './AIInsightCard';
//
// export function PortfolioDashboard() {
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-slate-900 to-neutral-900 p-4 md:p-8">
//             {/* 배경 패턴 - 기존 스타일과 동일 */}
//             <div className="fixed inset-0 opacity-[0.07] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
//
//             {/* 메인 컨테이너 */}
//             <div className="relative max-w-7xl mx-auto">
//                 {/* 그리드 레이아웃 */}
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                     {/* 포트폴리오 헤더 - 전체 너비 */}
//                     <div className="col-span-1 lg:col-span-2">
//                         <PortfolioHeader />
//                     </div>
//                     {/* 자산 배분 카드 */}
//                     <AssetAllocationCard />
//
//                     {/* 산업별 분석 카드 */}
//                     <IndustryBreakdownCard />
//
//                     {/* 보유 주식 목록 */}
//                     <StockHoldingsList />
//
//                     {/* AI 인사이트 카드 - 전체 너비 */}
//                     <div className="col-span-1 lg:col-span-2">
//                         <AIInsightCard />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }