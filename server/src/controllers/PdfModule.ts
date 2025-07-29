import { Module } from '@nestjs/common';
import { PdfService } from '../PdfService';
import { PdfController } from './PdfController';

@Module({
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule { }
