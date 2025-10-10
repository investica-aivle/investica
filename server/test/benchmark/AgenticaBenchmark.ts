import { AgenticaSelectBenchmark } from "@agentica/benchmark";
import type { AgenticaOperation } from "@agentica/core";
import { Agentica } from "@agentica/core";
import { NestFactory } from "@nestjs/core";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import typia from "typia";

import { MyGlobal } from "../../src/MyGlobal";
import { MyModule } from "../../src/MyModule";
import { IKisSessionData } from "../../src/models/KisTrading";
import { KisService } from "../../src/providers/kis/KisService";
import { KisSessionService } from "../../src/providers/kis/KisSessionService";
import { NewsAgentService } from "../../src/providers/news/NewsAgentService";
import { NewsService } from "../../src/providers/news/NewsService";
import { ReportsService } from "../../src/providers/reports/ReportsService";

// 테스트 데이터 인터페이스
interface TestCase {
  name: string;
  question: string;
  selected_fn: string[];
  selected_type: "standalone" | "anyOf" | "array" | "allOf"; // loadTestData에서 검증하므로 필수 속성
}

interface TestData {
  test: TestCase[];
}

// Mock KIS 세션 데이터 생성
function createMockKisSessionData(): IKisSessionData {
  return {
    accountNumber: "12345678-01",
    appKey: "mock-app-key",
    appSecret: "mock-app-secret",
    accessToken: "mock-access-token",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
  };
}

// Mock 리스너 생성
function createMockListener() {
  return {
    on: () => {},
    emit: () => {},
    off: () => {},
    onNews: async () => {},
    onStockFocus: async () => {},
    onTradingConfirmationRequest: async () => ({ id: "", confirmed: false }),
    describe: async () => {},
    assistantMessage: async () => {},
  };
}

// JSON 파일에서 테스트 데이터 로드
async function loadTestData(jsonPath: string): Promise<TestData> {
  try {
    console.log(`🔍 파일 경로 확인: ${jsonPath}`);
    const fullPath = path.resolve(jsonPath);
    console.log(`🔍 절대 경로: ${fullPath}`);

    // 파일 존재 여부 확인
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
      console.log(`✅ 파일 존재 확인됨`);
    } catch (accessError) {
      console.error(`❌ 파일 접근 실패:`, accessError);
      throw accessError;
    }

    console.log(`📖 파일 읽기 시작...`);
    const fileContent = await fs.promises.readFile(fullPath, "utf-8");
    console.log(`📖 파일 읽기 완료, 크기: ${fileContent.length} bytes`);

    console.log(`🔄 JSON 파싱 시작...`);
    const parsedData = JSON.parse(fileContent) as TestData;
    console.log(`🔄 JSON 파싱 완료`);

    // 타입 검증 및 필터링
    console.log(`🔍 타입 검증 및 필터링 시작...`);
    const supportedTypes = ["standalone", "anyOf", "array", "allOf"];
    const validTestCases = parsedData.test.filter((testCase) => {
      if (!testCase.selected_type) {
        console.warn(`⚠️ selected_type이 정의되지 않음: ${testCase.name}`);
        return false;
      }

      if (!supportedTypes.includes(testCase.selected_type)) {
        console.warn(
          `⚠️ 지원하지 않는 타입: ${testCase.selected_type} (${testCase.name})`,
        );
        return false;
      }

      return true;
    });

    console.log(
      `✅ 타입 검증 완료: ${validTestCases.length}/${parsedData.test.length}개 테스트 케이스 유효`,
    );

    return {
      test: validTestCases,
    };
  } catch (error) {
    console.error(`❌ JSON 파일 로드 실패: ${jsonPath}`, error);
    throw error;
  }
}

// 에이전트에서 함수 찾기 (공식 문서 예시 참고)
function findOperation(
  agent: Agentica<"chatgpt">,
  functionName: string,
): AgenticaOperation<"chatgpt"> {
  const found = agent
    .getOperations()
    .find((op) => op.function.name === functionName);

  if (found === undefined) {
    throw new Error(`Operation not found: ${functionName}`);
  }
  return found;
}

async function main(): Promise<void> {
  console.log("🚀 Agentica 벤치마크 시작");

  // JSON 파일 경로 설정 (기본값: test_function_mapping.json)
  const jsonPath =
    process.argv[2] || path.resolve(__dirname, "../benchmark_test.json");
  // JSON 파일에서 테스트 데이터 로드
  const testData = await loadTestData(jsonPath);
  console.log(`✅ ${testData.test.length}개 테스트 케이스 로드 완료`);

  // NestJS 애플리케이션 초기화
  const app = await NestFactory.createApplicationContext(MyModule);

  // 서비스 인스턴스 가져오기
  const kisService = app.get(KisService);
  const newsService = app.get(NewsService);
  const reportsService = app.get(ReportsService);

  // Mock 세션 생성
  const mockKisSessionData = createMockKisSessionData();
  const mockListener = createMockListener();

  // Agentica 에이전트 설정
  const agent = new Agentica({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: MyGlobal.env.OPENAI_API_KEY }),
      model: "gpt-4o-mini",
    },
    controllers: [
      typia.llm.controller<KisSessionService, "chatgpt">(
        "kis",
        new KisSessionService(kisService, mockKisSessionData, mockListener),
      ),
      typia.llm.controller<NewsAgentService, "chatgpt">(
        "news",
        new NewsAgentService(newsService, mockListener),
      ),
      typia.llm.controller<ReportsService, "chatgpt">(
        "reports",
        reportsService,
      ),
    ],
    config: {
      systemPrompt: {
        common: () =>
          "당신은 한국투자증권 KIS API를 통해 주식 거래를 도와주는 전문 AI 어시스턴트입니다. 모든 응답은 한국어로 해주세요.",
      },
      locale: "ko-KR",
      timezone: "Asia/Seoul",
    },
  });

  console.log("📊 Agentica Select 벤치마크 실행 중...");
  console.log(`📊 총 ${testData.test.length}개 시나리오 생성 중...`);

  // 공식 문서 예시에 맞는 벤치마크 생성
  console.log("🔧 벤치마크 객체 생성 중...");
  const benchmark = new AgenticaSelectBenchmark({
    agent: agent as any,
    config: {
      repeat: 1, // 반복 횟수 (빠른 테스트를 위해 1로 설정)
      simultaneous: 2, // 병렬 실행 수 (빠른 테스트를 위해 2로 설정)
    },
    scenarios: testData.test.map((testCase, index) => {
      console.log(
        `📝 시나리오 ${index + 1} 생성: ${testCase.name} - ${testCase.question.substring(0, 30)}...`,
      );

      // selected_type에 따라 expected 구조 결정
      let expected;

      if (testCase.selected_type === "standalone") {
        // 단일 함수 호출
        expected = {
          type: "standalone" as const,
          operation: (() => {
            const operation = findOperation(agent, testCase.selected_fn[0]);
            return operation;
          })(),
        };
      } else if (testCase.selected_type === "anyOf") {
        // 여러 함수 중 하나만 선택하면 되는 경우
        expected = {
          type: "anyOf" as const,
          anyOf: testCase.selected_fn.map((fnName) => {
            const operation = findOperation(agent, fnName);
            return {
              type: "standalone" as const,
              operation: operation,
            };
          }),
        };
      } else if (testCase.selected_type === "array") {
        // 순서대로 실행되어야 하는 경우
        expected = {
          type: "array" as const,
          items: testCase.selected_fn.map((fnName) => {
            const operation = findOperation(agent, fnName);
            return {
              type: "standalone" as const,
              operation: operation,
            };
          }),
        };
      } else if (testCase.selected_type === "allOf") {
        // 모든 함수가 실행되어야 하는 경우 (순서는 중요하지 않음)
        expected = {
          type: "allOf" as const,
          allOf: testCase.selected_fn.map((fnName) => {
            const operation = findOperation(agent, fnName);
            return {
              type: "standalone" as const,
              operation: operation,
            };
          }),
        };
      } else {
        // 이 경우는 발생하지 않아야 함 (loadTestData에서 필터링됨)
        throw new Error(
          `지원하지 않는 selected_type: ${testCase.selected_type}`,
        );
      }
      return {
        name: testCase.name,
        text: testCase.question,
        expected: expected,
      };
    }),
  });
  console.log("🔧 벤치마크 객체 생성 완료");

  console.log("🏃 벤치마크 시작:", new Date().toISOString());

  try {
    await benchmark.execute();
    console.log("✅ 벤치마크 실행 완료!", new Date().toISOString());
  } catch (error) {
    console.error("❌ 벤치마크 실행 실패:", error);
    throw error;
  }

  // 결과 리포트 생성
  const docs: Record<string, string> = benchmark.report();
  const root: string = "./docs/benchmarks/select";

  await rmdir(root);
  for (const [key, value] of Object.entries(docs)) {
    await mkdir(path.join(root, key.split("/").slice(0, -1).join("/")));
    await fs.promises.writeFile(path.join(root, key), value, "utf8");
  }

  console.log(`📊 벤치마크 리포트가 ${root}에 생성되었습니다.`);

  console.log("\n✅ Agentica Select 벤치마크 완료!");

  await app.close();
  console.log("\n✅ 벤치마크 완료!");
}

// 유틸리티 함수들 (공식 문서 예시에서 가져옴)
async function mkdir(str: string) {
  try {
    await fs.promises.mkdir(str, {
      recursive: true,
    });
  } catch {}
}

async function rmdir(str: string) {
  try {
    await fs.promises.rm(str, {
      recursive: true,
    });
  } catch {}
}

// main 함수를 export해서 index.ts에서 사용할 수 있도록 함
export default main;

// 직접 실행 시에만 main 함수 호출
if (require.main === module) {
  main().catch(console.error);
}
