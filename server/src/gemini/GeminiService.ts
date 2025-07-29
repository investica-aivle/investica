import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
// GoogleAIFileManager는 더 이상 직접 파일을 API에 전달하는 데 사용되지 않으므로 제거하거나 주석 처리할 수 있습니다.
// import { GoogleAIFileManager } from '@google/generative-ai/server';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch'; // fetch 가져오기

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private genAI: GoogleGenerativeAI;
    // private fileManager: GoogleAIFileManager; // 더 이상 사용되지 않음
    private readonly tempDir = path.join(__dirname, '..', '..', 'temp_files'); // 임시 파일 저장 디렉토리

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('app.googleApiKey');
        if (!apiKey) {
            throw new InternalServerErrorException('Google API Key not found in configuration.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // this.fileManager = new GoogleAIFileManager(apiKey); // 더 이상 사용되지 않음

        // 임시 디렉토리가 없으면 생성
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * URL에서 PDF 파일을 다운로드하여 임시 파일로 저장합니다.
     * @param url PDF 파일의 URL
     * @returns 저장된 파일의 경로 또는 null (다운로드 실패 시)
     */
    private async downloadPdf(url: string): Promise<string> {
        const filename = `temp_document_${Date.now()}.pdf`;
        const outputPath = path.join(this.tempDir, filename);

        try {
            this.logger.log(`PDF 다운로드 중: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
            this.logger.log(`PDF 다운로드 완료: ${outputPath}`);
            return outputPath;
        } catch (error: any) {
            this.logger.error(`PDF 다운로드 중 오류 발생: ${error.message}`);
            throw new InternalServerErrorException(`PDF 다운로드 실패: ${error.message}`);
        }
    }

    /**
     * PDF URL을 받아 Gemini API를 사용하여 내용을 자세히 정리합니다.
     * @param pdfUrl 정리할 PDF 파일의 URL
     * @returns 정리된 텍스트 내용
     */
    async summarizePdfFromUrl(pdfUrl: string): Promise<string> {
        let tempPdfPath: string | null = null;

        try {
            // 1. PDF 파일 다운로드
            tempPdfPath = await this.downloadPdf(pdfUrl);

            // 2. 다운로드된 PDF 파일을 Base64로 인코딩
            this.logger.log(`PDF 파일을 Base64로 인코딩 중: ${tempPdfPath}`);
            const pdfBuffer = fs.readFileSync(tempPdfPath);
            const base64Pdf = pdfBuffer.toString('base64');
            this.logger.log(`PDF 파일 Base64 인코딩 완료.`);

            // 3. 프롬프트 및 파일 파트 구성 (inlineData 사용)
            const filePart = {
                inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Pdf,
                },
            };

            const prompt = `
                다음 PDF 문서의 내용을 최대한 자세히 정리해 주세요.
                핵심 요약, 주요 섹션별 상세 내용, 중요한 통계나 수치, 그림이나 표에 대한 설명 등
                문서의 전체적인 내용을 이해하는 데 도움이 되도록 구조화하여 설명해 주세요.
                가능하다면 다음과 같은 형식으로 정리해주세요:

                # 문서 제목 (만약 문서에서 제목을 찾을 수 있다면)

                ## 1. 개요/요약
                [문서 전체의 핵심 내용을 1~2문단으로 요약]

                ## 2. 주요 섹션별 분석
                ### 2.1. [첫 번째 주요 섹션 제목]
                [해당 섹션의 상세 내용, 중요한 개념, 정보 등을 자세히 설명]

                ### 2.2. [두 번째 주요 섹션 제목]
                [해당 섹션의 상세 내용, 중요한 개념, 정보 등을 자세히 설명]
                ... (필요에 따라 더 많은 섹션 추가)

                ## 3. 핵심 데이터 및 통계 (만약 존재한다면)
                - [데이터 항목 1]: [값] ([단위], [설명])
                - [데이터 항목 2]: [값]: [값] ([단위], [설명])

                ## 4. 결론 및 시사점 (만약 존재한다면)
                [문서가 제시하는 결론이나 시사하는 바]

                ## 5. 기타 특이사항 (그래프, 이미지, 표 등)
                [문서 내의 중요한 시각적 요소에 대한 설명]

                최대한 자세하고 정확하게 답변해주세요.
            `;

            // 4. Gemini 모델 사용 및 API 호출
            // 'gemini-2.5-pro'는 PDF 처리를 지원하는 강력한 모델입니다.
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
            this.logger.log('Gemini API에 요청 전송 중...');
            const result = await model.generateContent([prompt, filePart]);
            const response = result.response;
            const text = response.text();

            this.logger.log('Gemini API 응답 수신 완료.');
            return text;

        } catch (error: any) {
            this.logger.error(`PDF 처리 중 오류 발생: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`PDF 처리 실패: ${error.message}`);
        } finally {
            // 임시 파일 정리
            if (tempPdfPath && fs.existsSync(tempPdfPath)) {
                fs.unlinkSync(tempPdfPath);
                this.logger.log(`임시 파일 삭제: ${tempPdfPath}`);
            }
            // GoogleAIFileManager를 통한 파일 삭제는 더 이상 필요하지 않습니다.
        }
    }
}
