import { Module } from '@nestjs/common';
import { GeminiService } from './GeminiService';

@Module({
    providers: [GeminiService],
    exports: [GeminiService], // 다른 모듈에서 GeminiService를 사용할 수 있도록 export
})
export class GeminiModule { }