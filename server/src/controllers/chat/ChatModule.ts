import { Module } from "@nestjs/common";

import { MiraeAssetScraperService } from "../../providers/reports/MiraeAssetScraperService";
import { MyChatController } from "./ChatController";

@Module({
  controllers: [MyChatController],
  providers: [MiraeAssetScraperService],
})
export class ChatModule {}
