import { Module } from "@nestjs/common";

import { ChatService } from "../../providers/chat/ChatService";
import { KisModule } from "../kis/KisModule";
import { NewsModule } from "../news/NewsModule";
import { ReportsModule } from "../reports/ReportsModule";
import { MyChatController } from "./ChatController";

@Module({
  imports: [KisModule, NewsModule, ReportsModule],
  providers: [ChatService],
  controllers: [MyChatController],
})
export class ChatModule {}
