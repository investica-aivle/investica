import { WebSocketAdaptor } from "@nestia/core";
import { NestiaEditorModule } from "@nestia/editor/lib/NestiaEditorModule";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { MyConfiguration } from "./MyConfiguration";
import { MyModule } from "./MyModule";

export class MyBackend {
  private application_?: INestApplication;

  public async open(): Promise<void> {
    //----
    // OPEN THE BACKEND SERVER
    //----
    // MOUNT CONTROLLERS
    this.application_ = await NestFactory.create(MyModule, { logger: false });
    await WebSocketAdaptor.upgrade(this.application_);

    // THE SWAGGER EDITOR
    const document = await NestiaSwaggerComposer.document(this.application_, {
      openapi: "3.1",
      servers: [
        {
          url: `http://localhost:${MyConfiguration.API_PORT()}`,
          description: "Local Server",
        },
      ],
    });
    await NestiaEditorModule.setup({
      path: "editor",
      application: this.application_,
      swagger: document as any,
      package: "Shopping Backend",
      simulate: true,
      e2e: true,
    });

    // DO OPEN
    this.application_.enableCors();
    await this.application_.listen(MyConfiguration.API_PORT(), "0.0.0.0");

    // 포트 정보 출력
    console.log(`🚀 Server is running on port ${MyConfiguration.API_PORT()}`);
    console.log(
      `📖 Swagger Editor: http://localhost:${MyConfiguration.API_PORT()}/editor`,
    );
    console.log(
      `🔗 API Base URL: http://localhost:${MyConfiguration.API_PORT()}`,
    );
    // 환경변수 확인
    console.log("🔧 Environment Variables Check:");
    console.log(`   API_PORT: ${process.env.API_PORT || "NOT SET"}`);
    console.log(
      `   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "SET" : "NOT SET"}`,
    );
    console.log(
      `   PERPLEXITY_API_KEY: ${process.env.PERPLEXITY_API_KEY ? "SET" : "NOT SET"}`,
    );
    console.log("");

    //----
    // POST-PROCESSES
    //----
    // INFORM TO THE PM2
    if (process.send) process.send("ready");

    // WHEN KILL COMMAND COMES
    process.on("SIGINT", async () => {
      await this.close();
      process.exit(0);
    });
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;

    // DO CLOSE
    await this.application_.close();
    delete this.application_;
  }
}
