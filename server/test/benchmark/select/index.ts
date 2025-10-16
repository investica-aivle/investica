import fs from "fs";
import path from "path";
import typia from "typia";

import type { AgenticaOperation } from "@agentica/core";
import { AgenticaSelectBenchmark } from "@agentica/benchmark";
import { Agentica } from "@agentica/core";
import OpenAI from "openai";

import { MyGlobal } from "../../../src/MyGlobal";
import { MyConfiguration } from "../../../src/MyConfiguration";
import { KisSessionService } from "../../../src/providers/kis/KisSessionService";
import { NewsAgentService } from "../../../src/providers/news/NewsAgentService";
import { ReportsService } from "../../../src/providers/reports/ReportsService";
import type { IKisSessionData } from "../../../src/models/KisTrading";
import type { IClientEvents } from "../../../src/types/agentica";

/**
 * Agentica Select Benchmark Test
 *
 * 이 테스트는 Agentica가 사용자 입력에 대해 올바른 function을 선택하는지 검증합니다.
 * 실제 function call은 실행하지 않고, 선택만 검증합니다.
 */
const main = async (): Promise<void> => {
  if (!MyGlobal.env.OPENAI_API_KEY) {
    console.log("⚠️ OPENAI_API_KEY가 설정되지 않았습니다. 테스트를 건너뜁니다.");
    return;
  }

  console.log("🚀 Agentica Select Benchmark 시작...");

  // Mock 데이터 및 서비스 (실제 호출하지 않으므로 mock으로 충분)
  const mockSessionData: IKisSessionData = {
    accountNumber: "test",
    appKey: "test",
    appSecret: "test",
    accessToken: "test",
    expiresAt: new Date(),
  };

  // IClientEvents 전체 구현
  const mockListener: IClientEvents = {
    onNews: async () => {},
    onStockFocus: async () => {},
    onTradingConfirmationRequest: async (req) => ({
      id: req.id,
      confirmed: false,
    }),
    describe: async () => {},
    assistantMessage: async () => {},
  };

  // Mock 서비스들 (select 테스트에서는 실제 구현 필요 없음)
  const mockKisService = {} as any;
  const mockNewsService = {} as any;
  const mockReportsService = {} as any;

  // Agentica 에이전트 생성
  const agent: Agentica<"chatgpt"> = new Agentica({
    model: "chatgpt",
    vendor: {
      model: "gpt-4o-mini",
      api: new OpenAI({
        apiKey: MyGlobal.env.OPENAI_API_KEY,
        // OpenAI SDK에서 usage 정보를 더 자세히 반환하도록 설정
        dangerouslyAllowBrowser: false,
      }),
    },
    controllers: [
      typia.llm.controller<KisSessionService, "chatgpt">(
        "kis",
        new KisSessionService(mockKisService, mockSessionData, mockListener),
      ),
      typia.llm.controller<NewsAgentService, "chatgpt">(
        "news",
        new NewsAgentService(mockNewsService, mockListener),
      ),
      typia.llm.controller<ReportsService, "chatgpt">(
        "reports",
        mockReportsService,
      ),
    ],
  });

  // Operation 찾기 헬퍼 함수 (클래스 기반)
  const find = (
    controllerName: string,
    methodName: string,
  ): AgenticaOperation<"chatgpt"> => {
    const found = agent
      .getOperations()
      .find(
        (op) =>
          op.protocol === "class" &&
          (op.controller as any).name === controllerName &&
          op.function.name === methodName,
      );
    if (found === undefined) {
      throw new Error(
        `Operation not found: ${controllerName}.${methodName}`,
      );
    }
    return found;
  };

  // 벤치마크 시나리오 정의
  const benchmark: AgenticaSelectBenchmark<"chatgpt"> =
    new AgenticaSelectBenchmark({
      agent,
      config: {
        repeat: 3, // 각 시나리오를 3번씩 반복
      },
      scenarios: [
        // 1️⃣ 기본 조회 - 현재가 조회
        {
          name: "주가_현재가_조회",
          text: "삼성전자 현재가 알려줘",
          expected: {
            type: "standalone",
            operation: find("kis", "getStockPrice"),
          },
        },
        {
          name: "주가_현재가_조회_약어",
          text: "삼전 지금 얼마야?",
          expected: {
            type: "standalone",
            operation: find("kis", "getStockPrice"),
          },
        },
        // 2️⃣ 차트 조회
        {
          name: "주가_일주일_추이",
          text: "카카오 최근 일주일 주가 추이 보여줘",
          expected: {
            type: "standalone",
            operation: find("kis", "getStockDailyPrices"),
          },
        },
        {
          name: "주가_월봉_차트",
          text: "LG전자 월봉 차트 보여줘",
          expected: {
            type: "standalone",
            operation: find("kis", "getStockDailyPrices"),
          },
        },
        // 3️⃣ 코스피 지수
        {
          name: "코스피_지수_조회",
          text: "코스피 지수 오늘 얼마야?",
          expected: {
            type: "standalone",
            operation: find("kis", "getKospiPrices"),
          },
        },
        {
          name: "코스피_1개월_흐름",
          text: "코스피 최근 1개월 흐름 보여줘",
          expected: {
            type: "standalone",
            operation: find("kis", "getKospiPrices"),
          },
        },
        // 4️⃣ 매매 관련
        {
          name: "매수_주문_시장가",
          text: "삼성전자 100주 사줘",
          expected: {
            type: "standalone",
            operation: find("kis", "buyStock"),
          },
        },
        {
          name: "매수_주문_시장가_명시",
          text: "카카오 50주 시장가로 매수해줘",
          expected: {
            type: "standalone",
            operation: find("kis", "buyStock"),
          },
        },
        {
          name: "매수_주문_지정가",
          text: "현대차 30만원에 10주 지정가 매수",
          expected: {
            type: "standalone",
            operation: find("kis", "buyStock"),
          },
        },
        {
          name: "매도_주문",
          text: "SK하이닉스 20주 팔아줘",
          expected: {
            type: "standalone",
            operation: find("kis", "sellStock"),
          },
        },
        // 5️⃣ 포트폴리오 조회
        {
          name: "포트폴리오_전체_조회",
          text: "내 포트폴리오 보여줘",
          expected: {
            type: "standalone",
            operation: find("kis", "getPortfolioData"),
          },
        },
        {
          name: "포트폴리오_보유종목",
          text: "내가 지금 뭐 갖고 있어?",
          expected: {
            type: "standalone",
            operation: find("kis", "getPortfolioData"),
          },
        },
        {
          name: "포트폴리오_수익률",
          text: "수익률 얼마야?",
          expected: {
            type: "standalone",
            operation: find("kis", "getPortfolioSummary"),
          },
        },
        {
          name: "포트폴리오_평가손익",
          text: "평가손익 보여줘",
          expected: {
            type: "standalone",
            operation: find("kis", "getPortfolioSummary"),
          },
        },
        {
          name: "포트폴리오_총자산",
          text: "총 자산 얼마야?",
          expected: {
            type: "standalone",
            operation: find("kis", "getPortfolioSummary"),
          },
        },
        // 6️⃣ 비교/분석 - 리포트 관련
        {
          name: "산업_추천_반도체",
          text: "반도체 관련 종목 추천해줘",
          expected: {
            type: "anyOf",
            anyOf: [
              {
                type: "standalone",
                operation: find("reports", "getSecuritiesIAReportList"),
              },
              {
                type: "standalone",
                operation: find("reports", "getIndustryEvaluation"),
              },
            ],
          },
        },
        {
          name: "산업_전망_2차전지",
          text: "2차전지 업종 전망 어때?",
          expected: {
            type: "anyOf",
            anyOf: [
              {
                type: "standalone",
                operation: find("reports", "getSecuritiesIAReportList"),
              },
              {
                type: "standalone",
                operation: find("reports", "getIndustryEvaluation"),
              },
            ],
          },
        },
        // 7️⃣ 시장 동향
        {
          name: "시장_요약",
          text: "지금 시장 상황 요약해줘",
          expected: {
            type: "standalone",
            operation: find("reports", "getRecentMarketSummary"),
          },
        },
        {
          name: "경제_이슈",
          text: "이번주 경제 이슈 뭐가 있어?",
          expected: {
            type: "standalone",
            operation: find("reports", "getRecentMarketSummary"),
          },
        },
        // 8️⃣ 리포트/뉴스
        {
          name: "리포트_목록",
          text: "증권사 리포트 뭐가 있어?",
          expected: {
            type: "standalone",
            operation: find("reports", "getSecuritiesISReportList"),
          },
        },
        {
          name: "리포트_산업분석",
          text: "자동차 산업 분석 리포트",
          expected: {
            type: "standalone",
            operation: find("reports", "getSecuritiesIAReportList"),
          },
        },
        {
          name: "뉴스_특정종목",
          text: "삼성전자 관련 뉴스 있어?",
          expected: {
            type: "standalone",
            operation: find("news", "getNewsSummary"),
          },
        },
        // 9️⃣ 복합 시나리오 - 매도 전량 (포트폴리오 조회 후 매도)
        {
          name: "매도_전량_복합",
          text: "네이버 전량 매도",
          expected: {
            type: "array",
            items: [
              {
                type: "standalone",
                operation: find("kis", "getPortfolioData"),
              },
              {
                type: "standalone",
                operation: find("kis", "sellStock"),
              },
            ],
          },
        },
        // 🔟 비교 시나리오 (여러 주가 조회)
        {
          name: "주가_비교",
          text: "삼성전자랑 SK하이닉스 중 어디가 나아?",
          expected: {
            type: "array",
            items: [
              {
                type: "standalone",
                operation: find("kis", "getStockPrice"),
              },
              {
                type: "standalone",
                operation: find("kis", "getStockPrice"),
              },
            ],
          },
        },
      ],
    });

  // 벤치마크 실행
  console.log("⏳ 벤치마크 실행 중...");
  await benchmark.execute();

  // 결과 저장
  const docs: Record<string, string> = benchmark.report();
  const root: string = `${MyConfiguration.ROOT}/docs/benchmarks/select`;

  await rmdir(root);
  for (const [key, value] of Object.entries(docs)) {
    const filePath = path.join(root, key);
    await mkdir(path.dirname(filePath));
    await fs.promises.writeFile(filePath, value, "utf8");
  }

  console.log("✅ 벤치마크 완료! 결과는 docs/benchmarks/select 폴더에 저장되었습니다.");
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});

async function mkdir(dirPath: string) {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch {}
}

async function rmdir(dirPath: string) {
  try {
    await fs.promises.rm(dirPath, { recursive: true });
  } catch {}
}
