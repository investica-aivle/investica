import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { ChatModule } from "./controllers/chat/ChatModule";
import { ReportsModule } from "./controllers/reports/ReportsModule";
import { KisModule } from "./controllers/kis/KisModule";
import { NewsModule } from "./controllers/news/NewsModule";
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "client"),
      serveRoot: "/",
    }),
    ChatModule,
    KisModule,
    NewsModule,
    ReportsModule,
  ],
})
export class MyModule {}
