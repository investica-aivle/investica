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

  // ? URL 기반 추출
  @Post('extract-from-url')
  async extractFromUrl(@Body() body: ExtractTextDto) {
    const { pdfUrl } = body;
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      throw new BadRequestException('유효한 pdfUrl이 필요합니다.');
    }

    try {
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

      if (!response.headers['content-type']?.includes('pdf')) {
        throw new BadRequestException('제공된 URL이 PDF 파일을 반환하지 않습니다.');
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
      throw new BadRequestException(`PDF 다운로드 또는 파싱 실패: ${error.message}`);
    }
  }

  @Get('extract-from-url')
  async extractFromUrlByQuery(@Query('pdfUrl') pdfUrl: string) {
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      throw new BadRequestException('유효한 pdfUrl이 필요합니다.');
    }

    try {
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

      if (!response.headers['content-type']?.includes('pdf')) {
        throw new BadRequestException('제공된 URL이 PDF 파일을 반환하지 않습니다.');
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
      throw new BadRequestException(`PDF 다운로드 또는 파싱 실패: ${error.message}`);
    }
  }
}
/*
# 윈도우 
# popper 다운로드
Invoke-WebRequest -Uri "https://github.com/oschwartz10612/poppler-windows/releases/download/v24.08.0-0/Release-24.08.0-0.zip" -OutFile "poppler-windows.zip"

# 압축 해제
Expand-Archive -Path "poppler-windows.zip" -DestinationPath "C:\poppler"

# PATH 환경변수에 추가
$env:PATH += ";C:\poppler\Library\bin" // popper 파일 경로
*/