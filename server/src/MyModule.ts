import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppModule } from "./controllers/pdf/pdfModule";
import { ChatModule } from "./controllers/chat/ChatModule";
import { AppConfigModule } from "./controllers/pdf/config.module";
import { PdfModule } from "./controllers/pdf/pdfServiceModule";

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