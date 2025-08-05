import { Module } from "@nestjs/common";

import { MiraeAssetScraperService } from "../../providers/reports/MiraeAssetScraperService";
import { ReportsController } from "./ReportsController";

@Module({
  controllers: [ReportsController],
  providers: [MiraeAssetScraperService],
  exports: [MiraeAssetScraperService],
})
export class ReportsModule {}
