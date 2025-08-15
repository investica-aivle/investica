import { Module } from "@nestjs/common";

import { KisModule } from "../kis/KisModule";
import { NewsModule } from "../news/NewsModule";
import { ReportsModule } from "../reports/ReportsModule";
import { MyChatController } from "./ChatController";
import { SessionManager } from "../../providers/session/SessionManager";
import { KisService } from "../../providers/kis/KisService";

@Module({
  imports: [KisModule, NewsModule, ReportsModule],
  providers: [SessionManager, KisService],
  controllers: [MyChatController],
})
export class ChatModule {}
