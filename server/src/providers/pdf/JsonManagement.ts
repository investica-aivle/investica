import * as fs from 'fs/promises';
import path from 'path';
import { Logger } from '@nestjs/common';

export type Report = {
    id: string;
    title: string;
    date: string;
    author: string;
    downloadUrl: string;
    mdFileName: string;
};

export type DBData = {
    latest_report: string;
    reports: Report[];
};

export class JsonManagement {

    private readonly logger = new Logger(JsonManagement.name);
    private DB_PATH: string;

    constructor(private readonly DB_path: string) {
        this.DB_PATH = DB_path;
        this.initializeDB();
    }

    private async initializeDB(): Promise<void> {
        try {
            await fs.access(this.DB_PATH);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                const defaultData: DBData = { latest_report: '', reports: [] };
                await this.saveDB(defaultData);
            } else {
                throw error;
            }
        }
    }

    async loadDB(): Promise<DBData> {
        try {
            const raw = await fs.readFile(this.DB_PATH, "utf-8");
            return JSON.parse(raw);
        } catch (error: any) {
            throw new Error(`데이터베이스 파일을 불러오거나 파싱하는 데 실패했습니다: ${error.message}`);
        }
    }

    async saveDB(data: DBData): Promise<void> {
        try {
            await fs.writeFile(this.DB_PATH, JSON.stringify(data, null, 2), "utf-8");
        } catch (error: any) {
            throw new Error(`데이터베이스 파일을 저장하는 데 실패했습니다: ${error.message}`);
        }
    }

    async addReport(report: Report): Promise<void> {
        const db = await this.loadDB();
        if (db.reports.some(r => r.id === report.id)) {
            this.logger.warn(`Report with ID ${report.id} already exists.`);
            return;
        }
        db.reports.push(report);
        db.latest_report = report.mdFileName;
        await this.saveDB(db);
    }

    async getReportById(id: string): Promise<Report | undefined> {
        const db = await this.loadDB();
        return db.reports.find(u => u.id === id);
    }

    async getLatestReportFileName(): Promise<string> {
        const db = await this.loadDB();
        return db.latest_report;
    }

    async getReportList(): Promise<Report[]> {
        const db = await this.loadDB();
        return db.reports;
    }

    async getReportByTitle(title: string): Promise<Report | undefined> {
        const db = await this.loadDB();
        return db.reports.find(report => report.title === title);
    }
}
