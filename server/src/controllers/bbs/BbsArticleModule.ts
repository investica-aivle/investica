import { Module } from "@nestjs/common";

import { BbsArticleProvider } from "../../providers/bbs/BbsArticleProvider";
import { BbsService } from "../../providers/bbs/BbsService";
import { BbsArticlesController } from "./BbsArticlesController";

@Module({
  controllers: [BbsArticlesController],
  providers: [BbsService, BbsArticleProvider],
  exports: [BbsService, BbsArticleProvider],
})
export class BbsArticleModule {}
