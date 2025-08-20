import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";
import { ReportAiProvider } from "../src/providers/reports/ReportAiProvider";

// .env.local 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

/**
 * ReportAiProvider.evaluateLatestIndustries()를 테스트하기 위한 스크립트입니다.
 * 
 * 실행 방법:
 * pnpm ts-node -r tsconfig-paths/register ./test/run-industry-evaluation.ts
 */
async function runIndustryEvaluation() {
  console.log("🚀 ReportAiProvider의 산업군 평가 기능을 실행합니다...");

  try {
    // ConfigService 모의 객체 생성
    const configServiceMock = {
      get: (key: string) => process.env[key],
    } as unknown as ConfigService;

    // HttpService 모의 객체 생성
    const httpServiceMock = {
      axiosRef: axios,
    } as unknown as HttpService;

    // 의존성 주입하여 Provider 인스턴스 생성
    const reportAiProvider = new ReportAiProvider(httpServiceMock, configServiceMock);

    // evaluateLatestIndustries() 호출 (최신 5개 보고서 대상)
    const result = await reportAiProvider.evaluateLatestIndustries(5);

    if (result) {
        console.log("\n✅ 최종 평가 결과:");
        console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error("❌ 스크립트 실행 중 오류가 발생했습니다:", error);
  }
}

runIndustryEvaluation();
