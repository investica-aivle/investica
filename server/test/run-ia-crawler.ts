import { MiraeAssetReportProvider } from '../src/providers/reports/MiraeAssetReportProvider';

/**
 * MiraeAssetReportProvider의 산업 분석(IA) 보고서 크롤링 기능을 테스트하기 위한 스크립트입니다.
 * 
 * 실행 방법:
 * pnpm ts-node -r tsconfig-paths/register ./test/run-ia-crawler.ts
 */
async function runIaCrawler() {
  console.log("🚀 산업 분석(IA) 보고서 크롤링을 시작합니다...");

  const provider = new MiraeAssetReportProvider();

  try {
    // scrapeAndSaveData(outputDir, syncWithExisting, isInvestmentStrategy)
    // isInvestmentStrategy를 false로 설정하여 산업 분석 보고서를 대상으로 합니다.
    await provider.scrapeAndSaveData(undefined, true, false);

    console.log("✅ 크롤링 및 데이터 저장이 성공적으로 완료되었습니다.");
    console.log("📄 확인: downloads/reports_IA.json");
  } catch (error) {
    console.error("❌ 크롤링 중 오류가 발생했습니다:", error);
  }
}

runIaCrawler();
