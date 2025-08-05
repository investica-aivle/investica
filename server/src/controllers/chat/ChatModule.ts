import { Module } from "@nestjs/common";

import { MyChatController } from "./ChatController";
import { KisModule } from "../kis/KisModule";

@Module({
  imports: [KisModule],
  controllers: [MyChatController],
})
export class ChatModule {}
