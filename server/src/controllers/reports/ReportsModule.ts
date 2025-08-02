import { Module } from "@nestjs/common";

import { MiraeAssetScraperService } from "../../providers/reports/MiraeAssetScraperService";
import { ReportScraperService } from "../../providers/reports/ReportScraperService";
import { ReportsController } from "./ReportsController";

@Module({
  controllers: [ReportsController],
  providers: [ReportScraperService, MiraeAssetScraperService],
  exports: [ReportScraperService, MiraeAssetScraperService],
})
export class ReportsModule {}
