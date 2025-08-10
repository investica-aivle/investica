import { Module } from '@nestjs/common';
import { ToolController } from './pdfToolController';
import { AppController } from './pdfContorller';
import { AppConfigModule } from './config.module';
import { PdfModule } from './pdfServiceModule';

@Module({
    imports: [
        AppConfigModule,
        PdfModule,
    ],
    controllers: [AppController, ToolController],
    providers: [],
})
export class AppModule { }