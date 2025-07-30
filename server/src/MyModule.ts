import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";
import { ChatModule } from "./controllers/chat/ChatModule";
import { ConfigModule } from '@nestjs/config';
import { NewsModule } from "./controllers/news/NewsModule";


@Module({
  imports: [
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'client') }),
    BbsArticleModule,
    ChatModule,
    NewsModule,          
    ConfigModule.forRoot(),
  ],
})
export class MyModule {}
