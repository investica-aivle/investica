import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

import { MiraeAssetReport } from "../../models/Reports";

/**
 * Mirae Asset Scraper Provider
 *
 * 미래에셋증권 웹사이트에서 보고서를 스크래핑하고 다운로드하는 기능을 제공합니다.
 * 내부적으로 사용되는 Provider입니다.
 */
@Injectable()
export class MiraeAssetScraperProvider {
  private readonly baseUrl = "https://securities.miraeasset.com";
  private readonly reportsUrl = `${this.baseUrl}/reports`;

  /**
   * 키워드로 최근 보고서 검색
   */
  public async getLatestReportsByKeywords(
    keywords: string[],
    limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    try {
      const response = await axios.get(this.reportsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const reports: MiraeAssetReport[] = [];

      // 보고서 목록 파싱
      $(".report-item").each((index, element) => {
        if (reports.length >= limit) return false;

        const title = $(element).find(".title").text().trim();
        const date = $(element).find(".date").text().trim();
        const author = $(element).find(".author").text().trim();
        const downloadUrl = $(element).find("a").attr("href");

        // 키워드 필터링
        const titleLower = title.toLowerCase();
        const hasKeyword = keywords.some((keyword) =>
          titleLower.includes(keyword.toLowerCase()),
        );

        if (hasKeyword && downloadUrl) {
          reports.push({
            title,
            date,
            author,
            downloadUrl: this.baseUrl + downloadUrl,
            fileName: path.basename(downloadUrl),
            category: this.categorizeReport(title),
          });
        }
      });

      return reports;
    } catch (error) {
      console.error("Error scraping reports:", error);
      return [];
    }
  }

  /**
   * PDF 파일 다운로드
   */
  public async downloadPdf(
    downloadUrl: string,
    outputDir: string = "./downloads",
  ): Promise<string> {
    try {
      // 출력 디렉토리 생성
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const response = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const fileName = path.basename(downloadUrl);
      const filePath = path.join(outputDir, fileName);

      fs.writeFileSync(filePath, response.data);

      return filePath;
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw new Error(`PDF 다운로드 실패: ${error}`);
    }
  }

  /**
   * 최신 보고서 목록 가져오기
   */
  public async getLatestReports(
    limit: number = 10,
  ): Promise<MiraeAssetReport[]> {
    try {
      const response = await axios.get(this.reportsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const reports: MiraeAssetReport[] = [];

      $(".report-item").each((index, element) => {
        if (reports.length >= limit) return false;

        const title = $(element).find(".title").text().trim();
        const date = $(element).find(".date").text().trim();
        const author = $(element).find(".author").text().trim();
        const downloadUrl = $(element).find("a").attr("href");

        if (downloadUrl) {
          reports.push({
            title,
            date,
            author,
            downloadUrl: this.baseUrl + downloadUrl,
            fileName: path.basename(downloadUrl),
            category: this.categorizeReport(title),
          });
        }
      });

      return reports;
    } catch (error) {
      console.error("Error getting latest reports:", error);
      return [];
    }
  }

  /**
   * Earnings Revision 보고서 가져오기
   */
  public async getEarningsRevisionReports(
    limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    return this.getLatestReportsByKeywords(["Earnings Revision"], limit);
  }

  /**
   * Credit Market Weekly 보고서 가져오기
   */
  public async getCreditMarketWeeklyReports(
    limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    return this.getLatestReportsByKeywords(["Credit Market Weekly"], limit);
  }

  /**
   * 보고서 카테고리 분류
   */
  private categorizeReport(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("실적") || titleLower.includes("earnings")) {
      return "실적분석";
    } else if (titleLower.includes("시장") || titleLower.includes("market")) {
      return "시장분석";
    } else if (titleLower.includes("신용") || titleLower.includes("credit")) {
      return "신용분석";
    } else if (titleLower.includes("주식") || titleLower.includes("stock")) {
      return "주식분석";
    } else {
      return "기타";
    }
  }
}
