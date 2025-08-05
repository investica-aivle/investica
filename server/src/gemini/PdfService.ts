import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch'; // fetch 가져오기

@Injectable()
export class PdfService {

    private readonly logger = new Logger(PdfService.name);
    private genAI: GoogleGenerativeAI;
    private readonly tempDir = path.join(__dirname, '..', '..', 'temp_files'); // 임시 파일 저장 디렉토리
    private readonly reportDir = path.join(__dirname, '..', '..', 'reports'); // 보고서가 저장될 디렉토리

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('app.googleApiKey');
        if (!apiKey) {
            throw new InternalServerErrorException('Google API Key not found in configuration.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);

        // 임시 디렉토리가 없으면 생성
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
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
    /** PDF 내용을 받아 .md 형식의 파일로 저장합니다.
     * @param content 추출된 PDF 내용
     * @returns 없음
     */
    private makeMarkdownFile(content: string) {
        const filePath = path.join(this.reportDir, 'latest_report.md');

        fs.writeFile(filePath, content, 'utf-8', (err) => {
            if (err) {
                console.log("파일 저장 실패", err);
            }
            else {
                console.log("보고서 파일 저장 완료");
            }
        })
    }


    /**
     * PDF URL을 받아 Gemini API를 사용하여 내용을 자세히 정리합니다.
     * @param pdfUrl 정리할 PDF 파일의 URL
     * @returns 정리된 텍스트 내용
     */
    async summarizePdfFromUrl(pdfUrl: string) {
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
첨부된 PDF는 금융 보고서입니다.

이 문서의 내용을 가능한 한 "정확하고 자세하게" 정리하십시오.
요약하거나 생략하지 말고, 보고서의 흐름과 세부 내용을 충실히 반영해 작성하십시오.
작성자의 해석이나 주관적 판단 없이, PDF에 포함된 내용을 기반으로 정리하십시오.
형식은 마크다운을 계층형식으로 작성하십시오.

그래프 같은 것 들이 있는 경우 각 그래프 마다 간단하게 지표를뽑아내거나 평가한정보가 있어야 함
제목이나 항목 구분 하며 본문 내용을 작성하십시오.

문서 외적인 설명, 요약, 해설, 주석은 포함하지 마십시오.
보고서 제목, 작성자, 날짜와 같은 부가 정보는 모두 제외하십시오.

결과는 아래 예시와 같이 **굵은 글씨**와 -을 활용한 리스트 형식으로 깔끔하게 정리하여야 함.

## 전세계 주식시장의 이익동향

    **전세계 12개월 선행 EPS** : 전월 대비 -0.1% 하락

    - 신흥국: -0.6%

    - 선진국: -0.01%

    - 국가별 변화

    - 상향 조정: 미국(+0.4%), 홍콩(+0.2%)

    - 하향 조정: 브라질(-2.0%), 일본(-1.2%), 중국(-0.9%)
            `;

            // 4. Gemini 모델 사용 및 API 호출
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
            this.logger.log('Gemini API에 요청 전송 중...');
            const result = await model.generateContent([prompt, filePart]);
            const response = result.response;
            const text = response.text();

            this.logger.log('Gemini API 응답 수신 완료.');
            this.makeMarkdownFile(text);

        } catch (error: any) {
            this.logger.error(`PDF 처리 중 오류 발생: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`PDF 처리 실패: ${error.message}`);
        } finally {
            // 임시 파일 정리
            if (tempPdfPath && fs.existsSync(tempPdfPath)) {
                fs.unlinkSync(tempPdfPath);
                this.logger.log(`임시 파일 삭제: ${tempPdfPath}`);
            }
        }
    }

    ReadMarkdownReport() {
        const filePath = path.join(this.reportDir, 'latest_report.md')

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return content;
        }
        catch (err) {
            this.logger.error("파일 읽기 실패")
            return '';
        }
    }

}
