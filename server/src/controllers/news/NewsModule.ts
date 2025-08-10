import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { NewsService } from "../../providers/news/NewsService";

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [NewsService],
  exports: [NewsService], 
})
export class NewsModule {}