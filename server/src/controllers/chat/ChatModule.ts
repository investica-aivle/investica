import { Module } from "@nestjs/common";

import { ChatService } from "../../providers/chat/ChatService";
import { ChatController } from "./ChatController";

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
