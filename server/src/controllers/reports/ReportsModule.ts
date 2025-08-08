import { Module } from "@nestjs/common";

import { MiraeAssetReportProvider } from "../../providers/reports/MiraeAssetReportProvider";
import { PerplexityProvider } from "../../providers/reports/PerplexityProvider";
import { ReportsService } from "../../providers/reports/ReportsService";
import { ReportsController } from "./ReportsController";

/**
 * Reports Module
 *
 * This module provides report functionality for scraping, downloading,
 * and converting financial reports from Mirae Asset Securities.
 */
@Module({
  controllers: [ReportsController],
  providers: [MiraeAssetReportProvider, PerplexityProvider, ReportsService],
  exports: [MiraeAssetReportProvider, PerplexityProvider, ReportsService],
})
export class ReportsModule {}
