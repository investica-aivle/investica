import { Body, Controller, Post } from '@nestjs/common';
import { GeminiService } from '../gemini/GeminiService';

interface SummarizePdfDto {
  pdfUrl: string;
}

@Controller('pdf2')
export class AppController {
  constructor(private readonly geminiService: GeminiService) { }

  @Post('summarize')
  async summarizePdf(@Body() body: SummarizePdfDto): Promise<{ summary: string }> {
    const { pdfUrl } = body;
    const summary = await this.geminiService.summarizePdfFromUrl(pdfUrl);
    return { summary };
  }
}