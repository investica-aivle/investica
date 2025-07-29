import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from '../gemini/config.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
    imports: [
        AppConfigModule, // 환경 설정 모듈 임포트
        GeminiModule,    // Gemini 서비스 모듈 임포트
    ],
    controllers: [AppController],
    providers: [], // AppController는 App.module에 직접 등록되었으므로 AppService는 제거
})
export class AppModule { }