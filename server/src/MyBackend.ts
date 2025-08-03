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
    console.log(`[STARTUP] Starting application...`);

    //----
    // OPEN THE BACKEND SERVER
    //----
    // MOUNT CONTROLLERS
    console.log(`[STARTUP] Creating NestJS application...`);
    this.application_ = await NestFactory.create(MyModule, {
      logger: {
        log: (message, context) => console.log(`[LOG] [${context || 'Application'}] ${message}`),
        error: (message, trace, context) => console.error(`[ERROR] [${context || 'Application'}] ${message}`, trace ? `\n${trace}` : ''),
        warn: (message, context) => console.warn(`[WARN] [${context || 'Application'}] ${message}`),
        debug: (message, context) => console.debug(`[DEBUG] [${context || 'Application'}] ${message}`),
        verbose: (message, context) => console.log(`[VERBOSE] [${context || 'Application'}] ${message}`),
      }
    });

    console.log(`[STARTUP] Upgrading WebSocket adaptor...`);
    await WebSocketAdaptor.upgrade(this.application_);

    // THE SWAGGER EDITOR
    console.log(`[STARTUP] Setting up Swagger documentation...`);
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
    console.log(`[STARTUP] Enabling CORS...`);
    this.application_.enableCors();

    const port = MyConfiguration.API_PORT();
    console.log(`[STARTUP] Starting server on port ${port}...`);
    await this.application_.listen(port, "0.0.0.0");

    console.log(`🚀 Server successfully started!`);
    console.log(`📍 Server running on: http://localhost:${port}`);
    console.log(`📚 Swagger Editor: http://localhost:${port}/editor`);
    console.log(`💬 WebSocket Chat: ws://localhost:${port}/chat`);

    //----
    // POST-PROCESSES
    //----
    // INFORM TO THE PM2
    if (process.send) {
      console.log(`[STARTUP] Notifying PM2 that server is ready...`);
      process.send("ready");
    }

    // WHEN KILL COMMAND COMES
    process.on("SIGINT", async () => {
      console.log(`[SHUTDOWN] Received SIGINT, shutting down gracefully...`);
      await this.close();
      process.exit(0);
    });
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;

    console.log(`[SHUTDOWN] Closing application...`);
    // DO CLOSE
    await this.application_.close();
    delete this.application_;
    console.log(`[SHUTDOWN] Application closed successfully.`);
  }
}
