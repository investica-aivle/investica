import { Module } from "@nestjs/common";
import { MyChatController } from "./ChatController";
import { KisModule } from "../kis/KisModule";
import { NewsModule } from "../news/NewsModule";

@Module({
  imports: [KisModule, NewsModule],
  controllers: [MyChatController],
})
export class ChatModule {}
