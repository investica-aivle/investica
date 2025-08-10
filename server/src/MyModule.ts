import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppModule } from "./gemini/pdfModule";
import { ChatModule } from "./controllers/chat/ChatModule";
import { AppConfigModule } from "./gemini/config.module";
import { PdfModule } from "./gemini/pdfServiceModule";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "client"),
      serveRoot: "/",
    }),
    AppModule,
    ChatModule,
    AppConfigModule,
    PdfModule,
  ],
})
export class MyModule { }