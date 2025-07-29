import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from '../gemini/config.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
    imports: [
        AppConfigModule, // ȯ�� ���� ��� ����Ʈ
        GeminiModule,    // Gemini ���� ��� ����Ʈ
    ],
    controllers: [AppController],
    providers: [], // AppController�� App.module�� ���� ��ϵǾ����Ƿ� AppService�� ����
})
export class AppModule { }