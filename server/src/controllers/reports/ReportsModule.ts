import { Module } from "@nestjs/common";

import { MiraeAssetScraperService } from "../../providers/reports/MiraeAssetScraperService";
import { PerplexityPdfConverterService } from "../../providers/reports/PerplexityPdfConverterService";
import { ReportsController } from "./ReportsController";

@Module({
  controllers: [ReportsController],
  providers: [MiraeAssetScraperService, PerplexityPdfConverterService],
  exports: [MiraeAssetScraperService, PerplexityPdfConverterService],
})
export class ReportsModule {}
