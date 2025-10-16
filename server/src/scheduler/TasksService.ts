import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from "../providers/reports/ReportsService";

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    constructor(
        private readonly reportsService: ReportsService,
    ) {}


    // 매일 새벽 3시에 실행
    @Cron('0 3 * * *', {
        timeZone: 'Asia/Seoul',
    })
    async handleISReportSync() {
        this.logger.debug('미래에셋 투자 전략 보고서 최신화 업데이트');
        const result = await this.reportsService.syncReports({ isISReports: true });
        this.logger.debug(result.message);
    }

    @Cron('30 3 * * *', {
        timeZone: 'Asia/Seoul',
    })
    async handleIAReportSync() {
        this.logger.debug('미래에셋 산업 분석 보고서 최신화 업데이트');
        const result = await this.reportsService.syncReports({ isISReports: false });
        this.logger.debug(result.message);
    }

    @Cron('0 4 * * *', {
        timeZone: 'Asia/Seoul',
    })
    async handleAIReportSync() {
        this.logger.debug('AI 보고서 최신화 업데이트');
        await this.reportsService.updateAiReports();
        this.logger.debug('AI 보고서 업데이트 완료');
    }
}