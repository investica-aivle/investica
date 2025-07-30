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
    console.log('🚀 Investica 서버를 시작합니다...');
    
    //----
    // OPEN THE BACKEND SERVER
    //----
    // MOUNT CONTROLLERS
    this.application_ = await NestFactory.create(MyModule, { 
      logger: ['log', 'error', 'warn', 'debug', 'verbose'] 
    });
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
      package: "Investica Backend",
      simulate: true,
      e2e: true,
    });

    // DO OPEN
    this.application_.enableCors();
    await this.application_.listen(MyConfiguration.API_PORT(), "0.0.0.0");

    console.log(`✅ Investica 서버가 성공적으로 시작되었습니다!`);
    console.log(`🌐 서버 주소: http://localhost:${MyConfiguration.API_PORT()}`);

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
