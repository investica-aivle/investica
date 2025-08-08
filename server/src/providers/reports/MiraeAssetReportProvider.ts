import { MiraeAssetReport, ReportsJsonData } from "@models/Reports";
import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as path from "path";

@Injectable()
export class MiraeAssetReportProvider {
  private readonly baseUrl = "https://securities.miraeasset.com";
  private readonly reportsUrl =
    "https://securities.miraeasset.com/bbs/board/message/list.do?categoryId=1527";

  /**
   * 미래에셋증권 보고서 스크래핑 및 다운로드 (동기화 포함)
   */
  public async scrapeAndSaveData(
    outputDir: string = "./downloads",
    syncWithExisting: boolean = true,
    keywords: string[] = [],
  ): Promise<{
    reports: MiraeAssetReport[];
  }> {
    try {
      // 1. 먼저 스크래핑으로 모든 보고서 가져오기
      const allReports = await this.scrapeReportsFromWeb(keywords);

      console.log(allReports);

      // 2. JSON 파일 기반 중복 제거
      const filteredReports = syncWithExisting
        ? this.filterDuplicateReportsFromJson(allReports, outputDir)
        : allReports;

      // 3. 필터링된 새로운 보고서들만 JSON 파일에 추가
      const reports = await this.saveReportsToJson(filteredReports, outputDir);

      return {
        reports,
      };
    } catch (error) {
      throw new Error(
        `Failed to scrape and save Mirae Asset reports data: ${error}`,
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
            const attachmentId = this.extractAttachmentId(downloadLink);
            reports.push({
              id: attachmentId || "unknown",
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

  // /**
  //  * 파일명 추출
  //  */
  // private extractFileName(
  //   downloadUrl: string,
  //   title: string,
  //   date: string,
  // ): string {
  //   // attachmentId 추출
  //   const urlParams = new URLSearchParams(downloadUrl.split("?")[1] || "");
  //   const attachmentId = urlParams.get("attachmentId") || "unknown";

  //   // 날짜를 yyyymmdd 형식으로 변환
  //   const dateObj = new Date(date);
  //   const formattedDate =
  //     dateObj.getFullYear().toString() +
  //     (dateObj.getMonth() + 1).toString().padStart(2, "0") +
  //     dateObj.getDate().toString().padStart(2, "0");

  //   // 제목에서 특수문자 제거 및 공백을 언더스코어로 변경
  //   const cleanTitle = title
  //     .replace(/[^\w\s가-힣]/g, "") // 특수문자 제거
  //     .replace(/\s+/g, "_") // 공백을 언더스코어로 변경
  //     .substring(0, 50); // 길이 제한

  //   return `${formattedDate}_${cleanTitle}_${attachmentId}.pdf`;
  // }

  /**
   * PDF 파일 다운로드 (더 이상 사용하지 않음 - Perplexity file_url 사용)
   */
  /*
  private async downloadPdf(
    report: MiraeAssetReport,
    outputDir: string = "./downloads",
  ): Promise<string> {
    try {
      const fileName = this.extractFileName(
        report.downloadUrl,
        report.title,
        report.date,
      );
      const filePath = path.join(outputDir, fileName);

      // 디렉토리가 없으면 생성
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 파일이 이미 존재하면 건너뛰기
      if (fs.existsSync(filePath)) {
        console.log(`File already exists: ${filePath}`);
        return filePath;
      }

      console.log(`Downloading: ${report.title} -> ${filePath}`);

      const response = await axios.get(report.downloadUrl, {
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`Download completed: ${filePath}`);
          resolve(filePath);
        });
        writer.on("error", reject);
      });
    } catch (error) {
      throw new Error(
        `Failed to download PDF for ${report.title}: ${error}`,
      );
    }
  }
  */

  /**
   * JSON 파일에서 중복된 보고서 필터링
   */
  private filterDuplicateReportsFromJson(
    reports: MiraeAssetReport[],
    outputDir: string,
  ): MiraeAssetReport[] {
    const jsonFilePath = path.join(outputDir, "reports.json");
    const existingIds = new Set<string>();

    // 기존 JSON 파일에서 ID들 읽기
    if (fs.existsSync(jsonFilePath)) {
      try {
        const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
        const existingData = JSON.parse(jsonContent);

        if (existingData.reports && Array.isArray(existingData.reports)) {
          existingData.reports.forEach((report: any) => {
            if (report.id) {
              existingIds.add(report.id);
            }
          });
        }

        console.log(`Found ${existingIds.size} existing report IDs in JSON`);
      } catch (error) {
        console.error(`Error reading existing JSON file:`, error);
      }
    }

    // 중복되지 않은 보고서만 필터링
    const filteredReports: MiraeAssetReport[] = [];
    for (const report of reports) {
      if (report.id && existingIds.has(report.id)) {
        console.log(
          `Skipping duplicate id: ${report.id} for "${report.title}"`,
        );
        continue;
      }

      filteredReports.push(report);
    }

    return filteredReports;
  }

  /**
   * 보고서 정보를 JSON 파일로 저장 (기존 데이터에 추가)
   */
  private async saveReportsToJson(
    newReports: MiraeAssetReport[],
    outputDir: string,
  ): Promise<MiraeAssetReport[]> {
    try {
      const filePath = path.join(outputDir, "reports.json");
      let existingData: ReportsJsonData = {
        lastUpdated: new Date().toISOString(),
        reports: [],
      };

      // 기존 JSON 파일이 있으면 읽기
      if (fs.existsSync(filePath)) {
        try {
          const jsonContent = fs.readFileSync(filePath, "utf8");
          existingData = JSON.parse(jsonContent);
          console.log(
            `기존 JSON 파일 읽기: ${existingData.reports.length}개 보고서`,
          );
        } catch (error) {
          console.error(`기존 JSON 파일 읽기 실패:`, error);
        }
      }

      // 새로운 보고서들만 추가
      const existingIds = new Set(existingData.reports.map((r: any) => r.id));
      const reportsToAdd = newReports
        .filter((report) => !existingIds.has(report.id))
        .map((report) => ({
          ...report,
          mdFileName: null, // 나중에 마크다운 변환 시 업데이트
        }));

      if (reportsToAdd.length > 0) {
        existingData.reports.push(...reportsToAdd);
        existingData.lastUpdated = new Date().toISOString();

        await fs.promises.writeFile(
          filePath,
          JSON.stringify(existingData, null, 2),
          "utf8",
        );
        console.log(
          `📄 보고서 정보 추가 완료: ${filePath} (${reportsToAdd.length}개 추가, 총 ${existingData.reports.length}개)`,
        );
      } else {
        console.log(`📄 새로운 보고서가 없습니다.`);
      }
      return existingData.reports;
    } catch (error) {
      console.error(`❌ 보고서 JSON 저장 실패:`, error);
      return [];
    }
  }
}
