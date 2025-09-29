import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ReportsController } from "../../controllers/reports/ReportsController";
import { MiraeAssetReportProvider } from "../../providers/reports/MiraeAssetReportProvider";
import { ReportsService } from "../../providers/reports/ReportsService";
import { AiAnalysisProvider } from "../../providers/reports/AiAnalysisProvider";
import { ReportBaseProvider } from "../../providers/reports/ReportBaseProvider";
import { ReportCacheManager } from "../../providers/reports/ReportCacheManager";
import { ReportConverter } from "../../providers/reports/ReportConverter";
import { ReportFileManager } from "../../providers/reports/ReportFileManager";
import { ReportKeywordExtractor } from "../../providers/reports/ReportKeywordExtractor";
import { ReportSummarizer } from "../../providers/reports/ReportSummarizer";

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    MiraeAssetReportProvider,
    ReportsService,
    AiAnalysisProvider,
    ReportBaseProvider,
    ReportCacheManager,
    ReportConverter,
    ReportFileManager,
    ReportKeywordExtractor,
    ReportSummarizer,
  ],
  exports: [ReportsService], // Only ReportsService needs to be exported for other modules
  controllers: [ReportsController],
})
export class ReportsModule {}
