import { Controller, Post, Body, BadRequestException, Get, Query } from '@nestjs/common';
import { PdfService } from '../PdfService';

interface ExtractTextDto {
  pdfUrl: string;
}

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) { }

  @Post('extract-text')
  async extractText(@Body() body: ExtractTextDto): Promise<string> {
    const { pdfUrl } = body;
    if (!pdfUrl) {
      throw new BadRequestException('pdfUrl is required');
    }
    try {
      return await this.pdfService.extractTextFromPdfUrl(pdfUrl);
    } catch (error) {
      throw new BadRequestException('Failed to extract text from PDF');
    }
  }

  @Get('extract-text')
  async extractTextByQuery(@Query('pdfUrl') pdfUrl: string): Promise<string> {
    if (!pdfUrl) {
      throw new BadRequestException('pdfUrl query parameter is required');
    }
    try {
      return await this.pdfService.extractTextFromPdfUrl(pdfUrl);
    } catch (error) {
      throw new BadRequestException('Failed to extract text from PDF');
    }
  }
}
