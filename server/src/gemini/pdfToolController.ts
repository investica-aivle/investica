import { Body, Controller, Get, Post } from '@nestjs/common';
import { PdfService } from './PdfService';
import { Report } from './JsonManagement';

export interface ReportIdentifierDto {
    identifier: string;
}


@Controller('tools')
export class ToolController {
    constructor(private readonly pdfService: PdfService) { }

    /**
     * 가장 최근에 생성된 PDF 분석 보고서의 내용을 가져옵니다.
     *
     * 이 기능은 시스템에 저장된 최신 증권 분석 보고서의 내용을
     * 마크다운(Markdown) 형식의 텍스트로 반환합니다.
     * 사용자가 최신 리포트 정보를 요약하거나 질문할 때 사용할 수 있습니다.
     *
     * @returns 마크다운 형식의 보고서 내용이 담긴 객체
     * @summary 최신 PDF 보고서 내용 조회
     * @tag PDF, Reports, latest
     */
    @Get('latest-report')
    async getLatestReport(): Promise<{ content: string }> {
        const content = await this.pdfService.getLatestReport();
        return { content };
    }

    /**
     * 해당 PDF 분석 보고서의 내용을 가져옵니다.
     *
     * 이 기능은 시스템에 저장된 특정 증권 분석 보고서의 내용을
     * 마크다운(Markdown) 형식의 텍스트로 반환합니다.
     * 사용자가 특정 리포트 정보를 요약하거나 질문할 때 사용할 수 있습니다.
     * 보고서는 보고서 목록의 메타데이터에서 ID 값을 기준으로 보고서를 찾아옵니다.
     *
     * @returns 마크다운 형식의 보고서 내용이 담긴 객체
     * @summary 특정 PDF 보고서 내용 조회
     * @tag PDF, Reports
     */
    @Post('get-report')
    async getReport(@Body() body: ReportIdentifierDto): Promise<{ content: string }> {
        const content = await this.pdfService.getMarkdownReport(body.identifier);
        return { content };
    }

    /**
     * 저장된 모든 PDF 분석 보고서의 목록을 가져옵니다.
     *
     * 이 기능은 시스템에 저장된 모든 증권 분석 보고서의 메타데이터 목록을 반환합니다.
     * 각 보고서는 제목, 날짜, 저자 등의 정보를 포함합니다.
     *
     * @returns 보고서 메타데이터 목록
     * @summary 모든 PDF 보고서 목록 조회
     * @tag PDF, Reports, List
     */
    @Get('report-list')
    async getReportList(): Promise<{ reports: Report[] }> {
        const reports = await this.pdfService.getReportList();
        return { reports };
    }
}