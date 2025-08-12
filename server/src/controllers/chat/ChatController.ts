import { Agentica } from "@agentica/core";
import {
  AgenticaRpcService,
  IAgenticaRpcListener,
  IAgenticaRpcService,
} from "@agentica/rpc";
import { IKisSessionData } from "@models/KisTrading";
import { WebSocketRoute } from "@nestia/core";
import { Controller, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";

import { MyGlobal } from "../../MyGlobal";
import { ChatService } from "../../providers/chat/ChatService";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";
import { KisService } from "../../providers/kis/KisService";
import { KisTradingProvider } from "../../providers/kis/KisTradingProvider";
import { NewsAgentService } from "../../providers/news/NewsAgentService";
import { NewsService } from "../../providers/news/NewsService";
import { ReportsService } from "../../providers/reports/ReportsService";
import { StockBalanceProvider } from "../../providers/stockBalance/StockBalanceProvider";
import { StocksProvider } from "../../providers/stocks/StocksProvider";

export interface IKisChatConnectionRequest {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}

/**
 * KIS 세션 데이터를 포함한 Agentica RPC 서비스 인터페이스
 */
export interface IAgenticaKisRpcService extends IAgenticaRpcService<"chatgpt"> {
  kisSessionData?: IKisSessionData;
}

@Controller("chat")
export class MyChatController {
  private readonly logger = new Logger(MyChatController.name);

  constructor(
    private readonly kisAuthProvider: KisAuthProvider,
    private readonly kisTradingProvider: KisTradingProvider,
    private readonly stocksService: StocksProvider,
    private readonly newsService: NewsService,
    private readonly stockBalanceProvider: StockBalanceProvider,
    private readonly chatService: ChatService,
    private readonly reportsService: ReportsService,
  ) {}

  @WebSocketRoute()
  public async start(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IKisChatConnectionRequest,
      IAgenticaKisRpcService,
      IAgenticaRpcListener
    >,
  ): Promise<void> {
    // 연결 시 전달받은 KIS 인증 정보 처리
    const connectionRequest = acceptor.header;
    const maskedAccountNumber = connectionRequest.accountNumber.replace(
      /(\d{4})\d+(\d{2})/,
      "$1****$2",
    );
    const maskedAppKey = connectionRequest.appKey.replace(
      /(.{8}).*(.{3})/,
      "$1***$2",
    );

    this.logger.log(`=== 웹소켓 연결 요청 시작 ===`);
    this.logger.log(`계좌번호: ${maskedAccountNumber}`);
    this.logger.log(`App Key: ${maskedAppKey}`);
    this.logger.log(`요청 시간: ${new Date().toISOString()}`);

    try {
      // KIS 인증 수행 - 실패 시 연결 거부
      this.logger.log(`=== KIS 인증 시작 ===`);
      this.logger.log(
        `KIS 인증 진행 중... 계좌: ${maskedAccountNumber}`,
      );

      const authStartTime = Date.now();
      const kisSessionData = await this.kisAuthProvider.authenticate({
        accountNumber: connectionRequest.accountNumber,
        appKey: connectionRequest.appKey,
        appSecret: connectionRequest.appSecret,
      });
      const authEndTime = Date.now();

      this.logger.log(`=== KIS 인증 성공 ===`);
      this.logger.log(`계좌번호: ${maskedAccountNumber}`);
      this.logger.log(`인증 소요시간: ${authEndTime - authStartTime}ms`);
      this.logger.log(`토큰 만료시간: ${kisSessionData.expiresAt.toISOString()}`);

      this.logger.log(`=== Agentica 에이전트 초기화 시작 ===`);
      const agentStartTime = Date.now();

      const agent: Agentica<"chatgpt"> = new Agentica({
        model: "chatgpt",
        vendor: {
          api: new OpenAI({ apiKey: MyGlobal.env.OPENAI_API_KEY }),
          model: "gpt-4o-mini",
        },
        controllers: [
          // Agentica 문서에 따른 올바른 TypeScript 클래스 프로토콜 사용
          typia.llm.controller<KisService, "chatgpt">(
            "kis",
            new KisService(
              this.kisTradingProvider,
              kisSessionData,
              this.stocksService,
              this.stockBalanceProvider,
            ),
          ),
          typia.llm.controller<NewsAgentService, "chatgpt">(
            "news",
            new NewsAgentService(this.newsService),
          ),
          typia.llm.controller<ReportsService, "chatgpt">(
            "reports",
            this.reportsService,
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

      const agentEndTime = Date.now();
      this.logger.log(`Agentica 에이전트 초기화 완료: ${agentEndTime - agentStartTime}ms`);
      this.logger.log(`컨트롤러 등록: KIS, News, Reports`);

      this.logger.log(`=== RPC 서비스 생성 및 웹소켓 연결 수락 ===`);
      const service = new AgenticaRpcService({
        agent,
        listener: acceptor.getDriver(),
      }) as IAgenticaKisRpcService;

      // 서비스 객체에 KIS 세션 데이터 직접 저장
      service.kisSessionData = kisSessionData;
      this.logger.log(`KIS 세션 데이터가 RPC 서비스에 저장됨`);

      await acceptor.accept(service);

      this.logger.log(`=== 웹소켓 연결 성공 ===`);
      this.logger.log(`계좌: ${maskedAccountNumber}`);
      this.logger.log(`총 소요시간: ${Date.now() - authStartTime}ms`);
      this.logger.log(`연결 상태: 활성`);

    } catch (error) {
      // KIS 인증 실패 시 연결 거부
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`=== KIS 인증 실패 ===`);
      this.logger.error(`계좌번호: ${maskedAccountNumber}`);
      this.logger.error(`App Key: ${maskedAppKey}`);
      this.logger.error(`실패 시간: ${new Date().toISOString()}`);
      this.logger.error(
        `인증 실패 상세:`,
        JSON.stringify(
          {
            error: errorMessage,
            stack: errorStack,
            errorType: error?.constructor?.name || "Unknown",
          },
          null,
          2,
        ),
      );

      // 클라이언트에게는 간단한 인증 실패 메시지만 전달
      throw new Error(
        "KIS 계좌 인증에 실패했습니다. 계좌번호, App Key, App Secret을 확인해주세요.",
      );
    }
  }
}
