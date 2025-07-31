import { Injectable, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

const execAsync = promisify(exec);

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    private genAI: GoogleGenerativeAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('app.googleApiKey');
        if (!apiKey) {
            throw new InternalServerErrorException('Google API Key not found in configuration.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async summarizePdfcontent(pdfContent: string): Promise<string> {
        try {
            const prompt = `
                다음은 금융사 PDF 보고서를 텍스트로 파싱한 결과물이다.
                내용을 최대한 자세하고 정확하게 정리해서 답변해라.
                답변은 보고서를 정리한 내용만 할 것.

                ${pdfContent}
            `;

            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            this.logger.log('Sending request to Gemini API...');
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            this.logger.log('Received response from Gemini API.');
            return text;

        } catch (error: any) {
            this.logger.error(`Error while summarizing PDF content: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Gemini request failed: ${error.message}`);
        }
    }

    async extractTextFromUrl(pdfUrl: string): Promise<{
        text: string;
        method: string;
        numPages: number;
        encoding: string;
    }> {
        try {
            const response = await axios.get(pdfUrl, {
                responseType: 'arraybuffer',
            });

            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.includes('pdf')) {
                throw new BadRequestException('The provided URL does not point to a valid PDF file.');
            }

            const buffer = Buffer.from(response.data);
            return await this.extractText(buffer);
        } catch (error: any) {
            this.logger.warn(`Failed to download PDF from URL: ${error.message}`);
            throw new BadRequestException(`Failed to download or fetch PDF: ${error.message}`);
        }
    }

    async extractText(buffer: Buffer): Promise<{
        text: string;
        method: string;
        numPages: number;
        encoding: string;
    }> {
        const tempPath = path.join(process.cwd(), 'temp', `pdf_${Date.now()}.pdf`);

        try {
            await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
            await fs.promises.writeFile(tempPath, buffer);

            const { stdout } = await execAsync(`pdftotext -enc UTF-8 -layout "${tempPath}" -`);
            const { stdout: pageCount } = await execAsync(`pdfinfo "${tempPath}" | findstr Pages`);
            const numPages = parseInt(pageCount.match(/Pages:\s*(\d+)/)?.[1] || '1', 10);

            return {
                text: stdout,
                method: 'poppler',
                numPages,
                encoding: 'UTF-8'
            };
        } finally {
            try {
                await fs.promises.unlink(tempPath);
            } catch (err: any) {
                this.logger.warn(`Failed to delete temporary PDF file: ${err.message}`);
            }
        }
    }

    cleanKoreanText(text: string): string {
        return text
            .replace(/\s+/g, ' ')
            .replace(/([가-힣])\s*([0-9a-zA-Z])/g, '$1 $2')
            .replace(/([0-9a-zA-Z])\s*([가-힣])/g, '$1 $2')
            .replace(/\s*([.,!?;:])\s*/g, '$1 ')
            .replace(/\s*\(\s*/g, ' (')
            .replace(/\s*\)\s*/g, ') ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }
}
