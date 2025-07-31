import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Body,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from '../../PdfService';
import axios from 'axios';

interface ExtractTextDto {
  pdfUrl: string;
}

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) { }

  // ? URL ��� ����
  @Post('extract-from-url')
  async extractFromUrl(@Body() body: ExtractTextDto) {
    const { pdfUrl } = body;
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      throw new BadRequestException('��ȿ�� pdfUrl�� �ʿ��մϴ�.');
    }

    try {
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

      if (!response.headers['content-type']?.includes('pdf')) {
        throw new BadRequestException('������ URL�� PDF ������ ��ȯ���� �ʽ��ϴ�.');
      }

      const buffer = Buffer.from(response.data);
      const result = await this.pdfService.extractText(buffer);
      const cleanText = this.pdfService.cleanKoreanText(result.text);

      return {
        success: true,
        data: {
          text: cleanText,
          numPages: result.numPages,
          encoding: result.encoding
        },
      };
    } catch (error: any) {
      throw new BadRequestException(`PDF �ٿ�ε� �Ǵ� �Ľ� ����: ${error.message}`);
    }
  }

  @Get('extract-from-url')
  async extractFromUrlByQuery(@Query('pdfUrl') pdfUrl: string) {
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      throw new BadRequestException('��ȿ�� pdfUrl�� �ʿ��մϴ�.');
    }

    try {
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

      if (!response.headers['content-type']?.includes('pdf')) {
        throw new BadRequestException('������ URL�� PDF ������ ��ȯ���� �ʽ��ϴ�.');
      }

      const buffer = Buffer.from(response.data);
      const result = await this.pdfService.extractText(buffer);
      const cleanText = this.pdfService.cleanKoreanText(result.text);
      const llmSummarize = await this.pdfService.summarizePdfcontent(cleanText);

      return {
        success: true,
        data: {
          text: llmSummarize,
          numPages: result.numPages,
          encoding: result.encoding
        },
      };
    } catch (error: any) {
      throw new BadRequestException(`PDF �ٿ�ε� �Ǵ� �Ľ� ����: ${error.message}`);
    }
  }
}
/*
# ������ 
# popper �ٿ�ε�
Invoke-WebRequest -Uri "https://github.com/oschwartz10612/poppler-windows/releases/download/v24.08.0-0/Release-24.08.0-0.zip" -OutFile "poppler-windows.zip"

# ���� ����
Expand-Archive -Path "poppler-windows.zip" -DestinationPath "C:\poppler"

# PATH ȯ�溯���� �߰�
$env:PATH += ";C:\poppler\Library\bin" // popper ���� ���
*/