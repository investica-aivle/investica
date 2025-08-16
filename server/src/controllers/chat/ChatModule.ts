import { Module } from "@nestjs/common";

import { KisModule } from "../kis/KisModule";
import { NewsModule } from "../news/NewsModule";
import { ReportsModule } from "../reports/ReportsModule";
import { MyChatController } from "./ChatController";
import { KisService } from "../../providers/kis/KisService";

@Module({
  imports: [KisModule, NewsModule, ReportsModule],
  providers: [KisService],
  controllers: [MyChatController],
})
export class ChatModule {}
