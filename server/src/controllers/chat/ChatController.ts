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

import { MyConfiguration } from "../../MyConfiguration";
import { MyGlobal } from "../../MyGlobal";
import { KisAuthProvider, IKisSessionData } from "../../providers/kis/KisAuthProvider";

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
    // KisTradingProvider는 향후 AI 에이전트에서 필요할 때 추가 예정
  ) {}

  @WebSocketRoute()
  public async start(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      IKisChatConnectionRequest,
      IAgenticaRpcService<"chatgpt"> & { kisSession?: IKisSessionData },
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

      const kisSession = await this.kisAuthProvider.authenticate({
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
          {
            protocol: "http",
            name: "bbs",
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
          // TODO: KIS API를 위한 컨트롤러 추가 예정
        ],
      });

      const service: AgenticaRpcService<"chatgpt"> & { kisSession?: IKisSessionData } =
        new AgenticaRpcService({
          agent,
          listener: acceptor.getDriver(),
        }) as any;

      // 서비스 객체에 KIS 세션 데이터 직접 저장
      service.kisSession = kisSession;

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

  /**
   * 소켓 서비스에서 KIS 세션 데이터 조회 (AI 에이전트에서 사용)
   */
  public static getKisSession(
    service: IAgenticaRpcService<"chatgpt"> & { kisSession?: IKisSessionData },
  ): IKisSessionData | undefined {
    return service.kisSession;
  }
}
