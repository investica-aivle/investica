import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { PdfService } from './PdfService';


export interface SummarizePdfDto {
  pdfUrl: string;
}


@Controller('pdf')
export class AppController {
  constructor(private readonly pdfService: PdfService) { }

  @Post('summarize')
  @ApiExcludeEndpoint()
  async summarizePdf(@Body() body: SummarizePdfDto) {
    const { pdfUrl } = body;
    const summary = await this.pdfService.summarizePdfFromUrl(pdfUrl);
  }
}