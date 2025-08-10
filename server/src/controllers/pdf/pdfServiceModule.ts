import { Module } from '@nestjs/common';
import { PdfService } from '../../providers/pdf/PdfService';

@Module({
    providers: [PdfService],
    exports: [PdfService],
})
export class PdfModule { }