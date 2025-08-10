import { Agentica } from "@agentica/core";
import {
  AgenticaRpcService,
  IAgenticaRpcListener,
  IAgenticaRpcService,
} from "@agentica/rpc";
import { WebSocketRoute } from "@nestia/core";
import { Controller, Logger } from "@nestjs/common";
import { HttpLlm, OpenApi } from "@samchon/openapi";
import OpenAI from "openai";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";

import { MyConfiguration } from "../../MyConfiguration";
import { MyGlobal } from "../../MyGlobal";
import { ChatService } from "../../providers/chat/ChatService";
import { KisAuthProvider, IKisSessionData } from "../../providers/kis/KisAuthProvider";
import { KisTradingProvider } from "../../providers/kis/KisTradingProvider";
import { KisService } from "../../providers/kis/KisService";
import { StocksProvider } from "../../providers/stocks/StocksProvider";
import { NewsService } from "../../providers/news/NewsService";
import { NewsAgentService } from "../../providers/news/NewsAgentService";
import { StockBalanceProvider } from "../../providers/stockBalance/StockBalanceProvider";

export interface IKisChatConnectionRequest {
  accountNumber: string;
  appKey: string;
  appSecret: string;
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
    private readonly chatService: ChatService
  ) {}

  @WebSocketRoute()
  public async start(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IKisChatConnectionRequest,
      IAgenticaRpcService<"chatgpt"> & { kisSessionData?: IKisSessionData },
      IAgenticaRpcListener
    >,
  ): Promise<void> {
    // 연결 시 전달받은 KIS 인증 정보 처리
    const connectionRequest = acceptor.header;
    const maskedAccountNumber = connectionRequest.accountNumber.replace(
      /(\d{4})\d+(\d{2})/,
      "$1****$2",
    );

    this.logger.log(
      `New WebSocket connection attempt for account: ${maskedAccountNumber}`,
    );

    try {
      // KIS 인증 수행 - 실패 시 연결 거부
      this.logger.log(
        `Starting KIS authentication for WebSocket connection: ${maskedAccountNumber}`,
      );

      const kisSessionData = await this.kisAuthProvider.authenticate({
        accountNumber: connectionRequest.accountNumber,
        appKey: connectionRequest.appKey,
        appSecret: connectionRequest.appSecret,
      });

      this.logger.log(
        `KIS authentication successful for WebSocket connection: ${maskedAccountNumber}`,
      );

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
            new KisService(this.kisTradingProvider, kisSessionData, this.stocksService, this.stockBalanceProvider)
          ),
          typia.llm.controller<NewsAgentService, "chatgpt">(
            "news",
            new NewsAgentService(this.newsService),
          ),
          {
            protocol: "http",
            name: "reports",
            application: HttpLlm.application({
              model: "chatgpt",
              document: OpenApi.convert(
                await fetch(
                  `http://localhost:${MyConfiguration.API_PORT()}/editor/swagger.json`,
                ).then((r) => r.json()),
              ),
            }),
            connection: {
              host: `http://localhost:${MyConfiguration.API_PORT()}`,
            },
          },
        ],
        config: {
          systemPrompt: {
            common: () => "당신은 한국투자증권 KIS API를 통해 주식 거래를 도와주는 전문 AI 어시스턴트입니다. 모든 응답은 한국어로 해주세요.",
          },
          locale: "ko-KR",
          timezone: "Asia/Seoul"
        }
      });

      const service: AgenticaRpcService<"chatgpt"> & { kisSessionData?: IKisSessionData } =
        new AgenticaRpcService({
          agent,
          listener: acceptor.getDriver(),
        });

      // 서비스 객체에 KIS 세션 데이터 직접 저장
      service.kisSessionData = kisSessionData;

      await acceptor.accept(service);
    } catch (error) {
      // KIS 인증 실패 시 연결 거부
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `KIS authentication failed for WebSocket connection: ${maskedAccountNumber}`,
        JSON.stringify({
          error: errorMessage,
          stack: errorStack,
          errorType: error?.constructor?.name || 'Unknown'
        }, null, 2)
      );

      // 클라이언트에게는 간단한 인증 실패 메시지만 전달
      throw new Error("KIS 계좌 인증에 실패했습니다. 계좌번호, App Key, App Secret을 확인해주세요.");
    }
  }
}
