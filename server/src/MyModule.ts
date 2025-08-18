import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { ChatModule } from "./controllers/chat/ChatModule";
import { KisModule } from "./controllers/kis/KisModule";
import { NewsModule } from "./controllers/news/NewsModule";
import { ReportsModule } from "./controllers/reports/ReportsModule";
import { StockOverviewModule } from "./controllers/stockoverview/StockOverviewModule";

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
    StockOverviewModule,
  ],
})
export class MyModule {}
