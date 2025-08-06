import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
<<<<<<< HEAD
import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";
import { ChatModule } from "./controllers/chat/ChatModule";
import { ConfigModule } from '@nestjs/config';
import { NewsModule } from "./controllers/news/NewsModule";
import { StocksModule } from "./controllers/stocks/sotcks.module";


@Module({
  imports: [
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'client') }),
    BbsArticleModule,
    ChatModule,
    NewsModule,          
    StocksModule,
    ConfigModule.forRoot()
=======

import { ChatModule } from "./controllers/chat/ChatModule";
import { KisModule } from "./controllers/kis/KisModule";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "client"),
      serveRoot: "/",
    }),
    ChatModule,
    KisModule,
>>>>>>> a1806262f11dcc2a792f2fcd3a5313dbcbd10aac
  ],
})
export class MyModule {}
