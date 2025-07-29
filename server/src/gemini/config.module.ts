import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './configuration';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [appConfig], // appConfig �ε�
            isGlobal: true, // �������� ��� �����ϰ� ����
            envFilePath: '.env', // .env ���� ��� ����
        }),
    ],
    exports: [ConfigModule], // �ٸ� ��⿡�� ConfigService�� ���Թ��� �� �ֵ��� export
})
export class AppConfigModule { }