import { Module } from "@nestjs/common";

import { MiraeAssetScraperProvider } from "../../providers/reports/MiraeAssetScraperProvider";
import { PerplexityPdfConverterProvider } from "../../providers/reports/PerplexityPdfConverterProvider";
import { ReportsFunctionProvider } from "../../providers/reports/ReportsFunctionProvider";
import { ReportsService } from "../../providers/reports/ReportsService";
import { ReportsController } from "./ReportsController";

@Module({
  controllers: [ReportsController],
  providers: [
    MiraeAssetScraperProvider,
    PerplexityPdfConverterProvider,
    ReportsFunctionProvider,
    ReportsService,
  ],
  exports: [
    MiraeAssetScraperProvider,
    PerplexityPdfConverterProvider,
    ReportsFunctionProvider,
    ReportsService,
  ],
})
export class ReportsModule {}
