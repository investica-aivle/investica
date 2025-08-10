import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '../../providers/pdf/configuration';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [appConfig],
            isGlobal: true,
            envFilePath: '.env',
        }),
    ],
    exports: [ConfigModule],
})
export class AppConfigModule { }