import { Module } from '@nestjs/common';
import { GeminiService } from './GeminiService';

@Module({
    providers: [GeminiService],
    exports: [GeminiService], // �ٸ� ��⿡�� GeminiService�� ����� �� �ֵ��� export
})
export class GeminiModule { }