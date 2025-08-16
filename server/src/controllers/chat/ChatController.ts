import { Agentica } from "@agentica/core";
import {
  AgenticaRpcService,
  IAgenticaRpcListener,
  IAgenticaRpcService,
} from "@agentica/rpc";
import { WebSocketRoute } from "@nestia/core";
import { Controller, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";
import { MyGlobal } from "../../MyGlobal";
import { KisService } from "../../providers/kis/KisService";
import { NewsAgentService } from "../../providers/news/NewsAgentService";
import { NewsService } from "../../providers/news/NewsService";
import { ReportsService } from "../../providers/reports/ReportsService";
import { SessionManager } from "../../providers/session/SessionManager";
import { CookieUtil } from "../../utils/CookieUtil";
import { KisSessionService } from "../../providers/kis/KisSessionService";
import { IClientEvents } from "../../types/agentica";
/**
 * WebSocket 연결 헤더 정의 (쿠키 포함)
 */
export interface IWebSocketHeaders {
  sessionKey: string;
}

@Controller("chat")
export class MyChatController {
  private readonly logger = new Logger(MyChatController.name);

  constructor(
    private readonly sessionManager: SessionManager,
    private readonly kisService: KisService,
    private readonly newsService: NewsService,
    private readonly reportsService: ReportsService
  ) {}

  @WebSocketRoute()
  public async start(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IWebSocketHeaders,
      IAgenticaRpcService<"chatgpt">,
      IClientEvents
    >,
  ): Promise<void> {
    this.logger.log(`=== 웹소켓 연결 요청 시작 ===`);
    this.logger.log(`요청 시간: ${new Date().toISOString()}`);

    try {
      // WebSocket 헤더에서 쿠키 추출
      const headers = acceptor.header;
      const sessionKey = headers.sessionKey || '';

      if (!sessionKey) {
        throw new Error("인증이 필요합니다. 쿠키를 포함해주세요.");
      }

      this.logger.log(`=== 세션 키 추출 성공 ===`);
      const maskedSessionKey = sessionKey.substring(0, 8) + "...";
      this.logger.log(`세션 키: ${maskedSessionKey}`);

      // 세션 키로 기존 세션 조회
      const existingSession = this.sessionManager.getSessionByKey(sessionKey);

      if (!existingSession || existingSession.expiresAt <= new Date()) {
        this.logger.error(`=== 세션 무효 ===`);
        this.logger.error(`세션이 만료되었거나 존재하지 않습니다.`);
        throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
      }

      // 기존 유효한 세션 사용
      const maskedAccountNumber = existingSession.kisSessionData.accountNumber.replace(
        /(\d{4})\d+(\d{2})/,
        "$1****$2",
      );

      this.logger.log(`=== 세션 검증 성공 ===`);
      this.logger.log(`세션 키: ${maskedSessionKey}`);
      this.logger.log(`계좌번호: ${maskedAccountNumber}`);
      this.logger.log(`세션 만료시간: ${existingSession.expiresAt.toISOString()}`);

      this.logger.log(`=== Agentica 에이전트 초기화 시작 ===`);
      const agentStartTime = Date.now();

      const listener = acceptor.getDriver();

      const agent: Agentica<"chatgpt"> = new Agentica({
        model: "chatgpt",
        vendor: {
          api: new OpenAI({ apiKey: MyGlobal.env.OPENAI_API_KEY }),
          model: "gpt-4o-mini",
        },
        controllers: [
          typia.llm.controller<KisSessionService, "chatgpt">(
            "kis",
            new KisSessionService(this.kisService, existingSession.kisSessionData),
          ),
          typia.llm.controller<NewsAgentService, "chatgpt">(
            "news",
            new NewsAgentService(this.newsService, listener),
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
      });

      this.logger.log(`세션 키가 RPC 서비스에 저장됨: ${maskedSessionKey}`);

      await acceptor.accept(service);

      this.logger.log(`=== 웹소켓 연결 성공 ===`);
      this.logger.log(`세션 키: ${maskedSessionKey}`);
      this.logger.log(`연결 상태: 활성`);

    } catch (error) {
      // 연결 실패 시 연결 거부
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`=== 연결 실패 ===`);
      this.logger.error(`실패 시간: ${new Date().toISOString()}`);
      this.logger.error(`실패 원인: ${errorMessage}`);

      if (errorStack) {
        this.logger.error(`스택 트레이스: ${errorStack}`);
      }

      // 클라이언트에게 적절한 에러 메시지 전달
      throw new Error(errorMessage);
    }
  }
}
