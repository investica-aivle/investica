import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ReportsController } from "../../controllers/reports/ReportsController";
import { MiraeAssetReportProvider } from "../../providers/reports/MiraeAssetReportProvider";
import { ReportAiProvider } from "../../providers/reports/ReportAiProvider";
import { ReportsService } from "../../providers/reports/ReportsService";

/**
 * Reports Module
 *
 * This module provides report functionality for scraping, downloading,
 * and converting financial reports from Mirae Asset Securities.
 */
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MiraeAssetReportProvider, ReportAiProvider, ReportsService],
  exports: [MiraeAssetReportProvider, ReportAiProvider, ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
