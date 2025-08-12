import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { MiraeAssetReportProvider } from "../../providers/reports/MiraeAssetReportProvider";
import { PerplexityProvider } from "../../providers/reports/PerplexityProvider";
import { ReportsService } from "../../providers/reports/ReportsService";

/**
 * Reports Module
 *
 * This module provides report functionality for scraping, downloading,
 * and converting financial reports from Mirae Asset Securities.
 */
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MiraeAssetReportProvider, PerplexityProvider, ReportsService],
  exports: [MiraeAssetReportProvider, PerplexityProvider, ReportsService],
})
export class ReportsModule {}
