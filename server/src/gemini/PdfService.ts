import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { JsonManagement, Report } from './JsonManagement';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';

@Injectable()
export class PdfService {

    private readonly logger = new Logger(PdfService.name);
    private genAI: GoogleGenerativeAI;
    private readonly tempDir = path.join(__dirname, '..', '..', 'temp_files');
    private readonly reportDir = path.join(__dirname, '..', '..', 'reports');
    private readonly jsonDBPath = path.join(__dirname, '..', '..', 'reports', 'report_info.json');
    private jsonDB: JsonManagement;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('app.googleApiKey');
        if (!apiKey) {
            throw new InternalServerErrorException('Google API Key not found in configuration.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.jsonDB = new JsonManagement(this.jsonDBPath);

        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

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
            await fsPromises.writeFile(outputPath, Buffer.from(arrayBuffer));
            this.logger.log(`PDF 다운로드 완료: ${outputPath}`);
            return outputPath;
        } catch (error: any) {
            this.logger.error(`PDF 다운로드 중 오류 발생: ${error.message}`);
            throw new InternalServerErrorException(`PDF 다운로드 실패: ${error.message}`);
        }
    }

    private async makeMarkdownFile(content: string, name: string): Promise<void> {
        const fileName = name.endsWith('.md') ? name : `${name}.md`;
        const filePath = path.join(this.reportDir, fileName);

        try {
            await fsPromises.writeFile(filePath, content, 'utf-8');
            this.logger.log(`보고서 파일 저장 완료: ${filePath}`);
        } catch (err: any) {
            this.logger.error(`파일 저장 실패: ${filePath}`, err);
            throw new InternalServerErrorException(`파일 저장 실패: ${err.message}`);
        }
    }

    async summarizePdfFromUrl(pdfUrl: string): Promise<string> {
        let tempPdfPath: string | null = null;

        try {
            tempPdfPath = await this.downloadPdf(pdfUrl);
            this.logger.log(`PDF 파일을 Base64로 인코딩 중: ${tempPdfPath}`);
            const pdfBuffer = await fsPromises.readFile(tempPdfPath);
            const base64Pdf = pdfBuffer.toString('base64');
            this.logger.log(`PDF 파일 Base64 인코딩 완료.`);

            const filePart = {
                inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Pdf,
                },
            };

            const prompt = `...`; // 프롬프트 내용은 생략

            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
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
            if (tempPdfPath) {
                try {
                    await fsPromises.unlink(tempPdfPath);
                    this.logger.log(`임시 파일 삭제: ${tempPdfPath}`);
                } catch (err: any) {
                    this.logger.error(`임시 파일 삭제 실패: ${tempPdfPath}`, err);
                }
            }
        }
    }

    async getMarkdownReport(identifier: string): Promise<string> {
        const directFileName = identifier.endsWith('.md') ? identifier : `${identifier}.md`;
        const directFilePath = path.join(this.reportDir, directFileName);

        // 1. Try to read by filename directly
        try {
            return await fsPromises.readFile(directFilePath, 'utf-8');
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                // For errors other than "Not Found", rethrow immediately
                this.logger.error("파일 읽기 실패 (초기 시도)", err);
                throw new InternalServerErrorException('파일을 읽는 중 오류가 발생했습니다.');
            }
        }

        // 2. If not found by filename, try to find by title in the DB
        this.logger.log(`파일을 찾지 못했습니다: ${directFileName}. 제목으로 다시 검색합니다: ${identifier}`);
        const reportByTitle = await this.jsonDB.getReportByTitle(identifier);

        if (reportByTitle && reportByTitle.mdFileName) {
            const filePathFromTitle = path.join(this.reportDir, reportByTitle.mdFileName);
            try {
                return await fsPromises.readFile(filePathFromTitle, 'utf-8');
            } catch (err: any) {
                this.logger.error(`제목으로 파일을 찾았으나 읽기 실패: ${filePathFromTitle}`, err);
                // If this specific file also isn't found, throw a clear error
                if (err.code === 'ENOENT') {
                    throw new NotFoundException(`'${identifier}'(으)로 보고서를 찾았으나 해당 파일(${reportByTitle.mdFileName})이 없습니다.`);
                }
                throw new InternalServerErrorException('파일을 읽는 중 오류가 발생했습니다.');
            }
        }

        // 3. If not found by filename or title, throw NotFoundException
        throw new NotFoundException(`'${identifier}'(으)로 보고서 파일 또는 제목을 찾을 수 없습니다.`);
    }

    async registReport(report_data: Report): Promise<void> {
        await this.jsonDB.addReport(report_data);
        const pdfContent = await this.summarizePdfFromUrl(report_data.downloadUrl);
        await this.makeMarkdownFile(pdfContent, report_data.mdFileName);
    }

    async getLatestReport(): Promise<string> {
        const fileName = await this.jsonDB.getLatestReportFileName();
        if (!fileName) {
            this.logger.log('최신 보고서 정보가 없습니다.');
            return '';
        }
        return this.getMarkdownReport(fileName);
    }

    async getReportList(): Promise<Report[]> {
        return this.jsonDB.getReportList();
    }
}