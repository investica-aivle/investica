import { Module } from '@nestjs/common';
import { PdfService } from './PdfService';

@Module({
    providers: [PdfService],
    exports: [PdfService],
})
export class PdfModule { }