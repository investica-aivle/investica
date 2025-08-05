import { Module } from "@nestjs/common";

import { MyChatController } from "./ChatController";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";
import { KisTradingProvider } from "../../providers/kis/KisTradingProvider";

@Module({
  controllers: [MyChatController],
  providers: [KisAuthProvider, KisTradingProvider],
})
export class ChatModule {}
