import { Agentica } from "@agentica/core";
import {
  AgenticaRpcService,
  IAgenticaRpcListener,
  IAgenticaRpcService,
} from "@agentica/rpc";
import { WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { HttpLlm, OpenApi } from "@samchon/openapi";
import OpenAI from "openai";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";

import { MyConfiguration } from "../../MyConfiguration";
import { MyGlobal } from "../../MyGlobal";
import { MiraeAssetScraperService } from "../../providers/reports/MiraeAssetScraperService";

@Controller("chat")
export class MyChatController {
  constructor(
    private readonly miraeAssetScraperService: MiraeAssetScraperService,
  ) {}

  @WebSocketRoute()
  public async start(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      undefined,
      IAgenticaRpcService<"chatgpt">,
      IAgenticaRpcListener
    >,
  ): Promise<void> {
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
        // 보고서 스크래핑 컨트롤러 추가
        typia.llm.controller<MyChatController, "chatgpt">("reports", this),
      ],
    });
    const service: AgenticaRpcService<"chatgpt"> = new AgenticaRpcService({
      agent,
      listener: acceptor.getDriver(),
    });
    await acceptor.accept(service);
  }

  // 보고서 관련 메서드들
  async getLatestReports(
    keywords: string[] = ["Earnings Revision", "Credit Market Weekly"],
    limit: number = 5,
  ) {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      keywords,
      limit,
    );
  }

  async getEarningsRevisionReports(limit: number = 5) {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      ["Earnings Revision"],
      limit,
    );
  }

  async getCreditMarketWeeklyReports(limit: number = 5) {
    return await this.miraeAssetScraperService.getLatestReportsByKeywords(
      ["Credit Market Weekly"],
      limit,
    );
  }

  async downloadReport(downloadUrl: string, outputDir: string = "./downloads") {
    try {
      const filePath = await this.miraeAssetScraperService.downloadPdf(
        downloadUrl,
        outputDir,
      );
      return { filePath, success: true };
    } catch (error) {
      return { filePath: "", success: false };
    }
  }
}
