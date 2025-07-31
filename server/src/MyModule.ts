import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppModule } from "./controllers/app.module";
import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";
import { ChatModule } from "./controllers/chat/ChatModule";
import { PdfModule } from "./controllers/PdfModule";
import { AppConfigModule } from "./gemini/config.module";
import { GeminiModule } from "./gemini/gemini.module";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "client"),
      serveRoot: "/",
    }),
    AppModule,
    BbsArticleModule,
    ChatModule,
    PdfModule,
    AppConfigModule,
    GeminiModule,
  ],
})
export class MyModule { }