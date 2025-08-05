import { Module } from "@nestjs/common";

import { MyChatController } from "./ChatController";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";

@Module({
  controllers: [MyChatController],
  providers: [KisAuthProvider],
})
export class ChatModule {}
