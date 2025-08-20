import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";
import { MiraeAssetReportProvider } from "../src/providers/reports/MiraeAssetReportProvider";
import { ReportAiProvider } from "../src/providers/reports/ReportAiProvider";
import { ReportsService } from "../src/providers/reports/ReportsService";

// .env.local 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

/**
 * ReportsService.syncReports(false)를 테스트하기 위한 스크립트입니다.
 * isISReports를 false로 설정하여 산업 분석(IA) 보고서의 동기화를 실행합니다.
 * 
 * 실행 방법:
 * pnpm ts-node -r tsconfig-paths/register ./test/run-sync-reports-ia.ts
 */
async function runSyncReportsForIA() {
  console.log("🚀 ReportsService - 산업 분석(IA) 보고서 동기화를 시작합니다...");

  try {
    // ConfigService 모의 객체 생성
    const configServiceMock = {
      get: (key: string) => process.env[key],
    } as unknown as ConfigService;

    // HttpService 모의 객체 생성
    const httpServiceMock = {
      axiosRef: axios,
    } as unknown as HttpService;

    // 의존성 주입
    const miraeAssetProvider = new MiraeAssetReportProvider();
    const reportAiProvider = new ReportAiProvider(httpServiceMock, configServiceMock);
    const reportsService = new ReportsService(miraeAssetProvider, reportAiProvider);

    // syncReports(false) 호출 실행전 reportsService 의 syncReports 를 public 으로 설정
    const result = await reportsService.syncReports(false);

    console.log("\n✅ 동기화가 성공적으로 완료되었습니다.");
    console.log(`   - 메시지: ${result.message}`);
    console.log(`   - 신규 스크래핑: ${result.scrapedCount}개`);
    console.log(`   - 마크다운 변환: ${result.convertedCount}개`);

  } catch (error) {
    console.error("❌ 동기화 중 오류가 발생했습니다:", error);
  }
}

runSyncReportsForIA();