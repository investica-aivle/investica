import { Body, Controller, Get, Post } from '@nestjs/common';
import { PdfService } from './PdfService';

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
     * @tag PDF, Reports
     */
    @Post('read-report')
    async getLatestReport(): Promise<{ content: string }> {
        const content = this.pdfService.ReadMarkdownReport();
        return { content };
    }
}