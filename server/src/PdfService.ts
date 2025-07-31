import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import axios from 'axios';

const execAsync = promisify(exec);

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

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
                throw new BadRequestException('제공된 URL이 PDF 파일이 아닙니다.');
            }

            const buffer = Buffer.from(response.data);
            return await this.extractText(buffer);
        } catch (error: any) {
            this.logger.warn(`PDF 다운로드 실패: ${error.message}`);
            throw new BadRequestException(`PDF 다운로드 또는 파싱 실패: ${error.message}`);
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
                this.logger.warn(`임시 파일 삭제 실패: ${err.message}`);
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
