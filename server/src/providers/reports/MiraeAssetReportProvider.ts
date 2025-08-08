import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as path from "path";

import { MiraeAssetReport } from "../../models/Reports";

@Injectable()
export class MiraeAssetReportProvider {
  private readonly baseUrl = "https://securities.miraeasset.com";
  private readonly reportsUrl =
    "https://securities.miraeasset.com/bbs/board/message/list.do?categoryId=1527";

  /**
   * 미래에셋증권 보고서 스크래핑 및 다운로드 (동기화 포함)
   */
  public async scrapeAndDownloadReports(
    keywords: string[] = [],
    outputDir: string = "./downloads",
    syncWithExisting: boolean = true,
  ): Promise<{
    reports: MiraeAssetReport[];
    downloadedFiles: string[];
  }> {
    try {
      // 1. 먼저 스크래핑으로 모든 보고서 가져오기
      const allReports = await this.scrapeReportsFromWeb(keywords);

      // 2. 중복 제거 및 필터링
      const filteredReports = syncWithExisting
        ? this.filterDuplicateReports(allReports, outputDir)
        : allReports;

      // 3. 다운로드
      const downloadedFiles: string[] = [];
      for (const report of filteredReports) {
        try {
          const filePath = await this.downloadPdf(report, outputDir);
          downloadedFiles.push(filePath);
          console.log(`Downloaded: ${report.title} -> ${filePath}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`Failed to download ${report.title}: ${errorMessage}`);
        }
      }

      return {
        reports: filteredReports,
        downloadedFiles,
      };
    } catch (error) {
      throw new Error(
        `Failed to scrape and download Mirae Asset reports: ${error}`,
      );
    }
  }

  /**
   * 웹에서 보고서 스크래핑
   */
  private async scrapeReportsFromWeb(
    keywords: string[],
  ): Promise<MiraeAssetReport[]> {
    try {
      const response = await axios.get(this.reportsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        responseType: "arraybuffer",
      });

      // EUC-KR로 디코딩 시도
      let htmlContent: string;
      try {
        htmlContent = iconv.decode(response.data, "euc-kr");
      } catch (error) {
        // EUC-KR 실패 시 UTF-8 시도
        htmlContent = Buffer.from(response.data).toString("utf8");
      }

      const $ = cheerio.load(htmlContent);
      const reports: MiraeAssetReport[] = [];

      $("table tr").each((_, element) => {
        const $row = $(element);

        const titleElement = $row.find("a");
        const title = titleElement.text().trim();
        const date = $row.find("td").eq(0).text().trim();
        const author = $row.find("td").eq(2).text().trim();
        const downloadLink = this.extractDownloadUrl($row);
        const hasKeyword = keywords.some((keyword) =>
          title.toLowerCase().includes(keyword.toLowerCase()),
        );

        if (title && downloadLink) {
          if ((keywords.length > 0 && hasKeyword) || keywords.length === 0) {
            reports.push({
              title,
              date,
              author,
              downloadUrl: downloadLink,
            });
          }
        }
      });

      return reports;
    } catch (error) {
      throw new Error(`Failed to scrape reports from web: ${error}`);
    }
  }

  /**
   * 기존 다운로드된 PDF 파일들에서 attachmentId 추출
   */
  private getExistingAttachmentIds(outputDir: string): Set<string> {
    const attachmentIds = new Set<string>();

    try {
      if (!fs.existsSync(outputDir)) {
        return attachmentIds;
      }

      const files = fs.readdirSync(outputDir);

      for (const file of files) {
        if (file.endsWith(".pdf")) {
          const attachmentId = this.extractAttachmentIdFromFileName(file);
          if (attachmentId) {
            attachmentIds.add(attachmentId);
          }
        }
      }

      console.log(
        `Found ${attachmentIds.size} existing attachmentIds: ${Array.from(attachmentIds).join(", ")}`,
      );
    } catch (error) {
      console.error(`Error reading existing files from ${outputDir}:`, error);
    }

    return attachmentIds;
  }

  /**
   * 파일명에서 attachmentId 추출 (yyyymmdd_title_attachmentId.pdf 형식)
   */
  private extractAttachmentIdFromFileName(fileName: string): string | null {
    try {
      // yyyymmdd_title_attachmentId.pdf 형식에서 attachmentId 추출
      const parts = fileName.replace(".pdf", "").split("_");
      if (parts.length >= 3) {
        return parts[parts.length - 1]; // 마지막 부분이 attachmentId
      }
      return null;
    } catch (error) {
      console.error(
        `Error extracting attachmentId from filename ${fileName}:`,
        error,
      );
      return null;
    }
  }

  /**
   * 다운로드 URL에서 attachmentId 추출
   */
  private extractAttachmentId(downloadUrl: string): string | null {
    try {
      const urlParams = new URLSearchParams(downloadUrl.split("?")[1] || "");
      return urlParams.get("attachmentId");
    } catch (error) {
      console.error(
        `Error extracting attachmentId from URL ${downloadUrl}:`,
        error,
      );
      return null;
    }
  }

  /**
   * 다운로드 URL 추출
   */
  private extractDownloadUrl($row: cheerio.Cheerio<any>): string | null {
    // 방법 1: href에 download와 pdf가 포함된 링크 찾기
    const downloadLinks = $row.find(
      'a[href*="download"][href*=".pdf"], a[href*="download"][href*="pdf"]',
    );

    if (downloadLinks.length > 0) {
      const href = downloadLinks.first().attr("href");
      if (href) {
        // javascript:downConfirm 함수에서 URL 추출
        if (href.startsWith("javascript:downConfirm")) {
          const match = href.match(/downConfirm\('([^']+)'/);
          if (match) {
            return match[1];
          }
        }
        // 상대 경로인 경우 절대 경로로 변환
        return href.startsWith("http") ? href : `${this.baseUrl}${href}`;
      }
    }
    return null;
  }

  /**
   * 파일명 추출
   */
  private extractFileName(
    downloadUrl: string,
    title: string,
    date: string,
  ): string {
    // attachmentId 추출
    const urlParams = new URLSearchParams(downloadUrl.split("?")[1] || "");
    const attachmentId = urlParams.get("attachmentId") || "unknown";

    // 날짜를 yyyymmdd 형식으로 변환
    const dateObj = new Date(date);
    const formattedDate =
      dateObj.getFullYear().toString() +
      (dateObj.getMonth() + 1).toString().padStart(2, "0") +
      dateObj.getDate().toString().padStart(2, "0");

    // 제목에서 특수문자 제거 및 공백을 언더스코어로 변경
    const cleanTitle = title
      .replace(/[^\w\s가-힣]/g, "") // 특수문자 제거
      .replace(/\s+/g, "_") // 공백을 언더스코어로 변경
      .substring(0, 50); // 길이 제한

    return `${formattedDate}_${cleanTitle}_${attachmentId}.pdf`;
  }

  /**
   * PDF 파일 다운로드
   */
  private async downloadPdf(
    report: MiraeAssetReport,
    outputDir: string = "./downloads",
  ): Promise<string> {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const response = await axios.get(report.downloadUrl, {
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      // 파일명 추출
      const fileName = this.extractFileName(
        report.downloadUrl,
        report.title,
        report.date,
      );
      const filePath = path.join(outputDir, fileName);

      // 파일 스트림으로 저장
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to download PDF from ${report.downloadUrl}: ${errorMessage}`,
      );
    }
  }

  /**
   * 중복된 보고서 필터링
   */
  private filterDuplicateReports(
    reports: MiraeAssetReport[],
    outputDir: string,
  ): MiraeAssetReport[] {
    const existingAttachmentIds = this.getExistingAttachmentIds(outputDir);
    const filteredReports: MiraeAssetReport[] = [];

    for (const report of reports) {
      const attachmentId = this.extractAttachmentId(report.downloadUrl);

      if (attachmentId && existingAttachmentIds.has(attachmentId)) {
        console.log(
          `Skipping duplicate attachmentId: ${attachmentId} for "${report.title}"`,
        );
        continue;
      }

      filteredReports.push(report);
    }

    return filteredReports;
  }
}
