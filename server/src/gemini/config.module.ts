import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './configuration';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [appConfig], // appConfig 로드
            isGlobal: true, // 전역으로 사용 가능하게 설정
            envFilePath: '.env', // .env 파일 경로 지정
        }),
    ],
    exports: [ConfigModule], // 다른 모듈에서 ConfigService를 주입받을 수 있도록 export
})
export class AppConfigModule { }