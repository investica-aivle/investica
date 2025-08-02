import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";

export interface ReportData {
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  source: string;
}

@Injectable()
export class ReportScraperService {
  /**
   * 특정 사이트에서 보고서를 스크래핑
   */
  async scrapeReport(url: string): Promise<ReportData> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // 사이트별 파싱 로직 (예시)
      const title = $("h1").first().text().trim();
      const content = $("article, .content, .post-content").text().trim();

      return {
        title,
        content,
        url,
        publishedAt: new Date(),
        source: new URL(url).hostname,
      };
    } catch (error) {
      throw new Error(`Failed to scrape report from ${url}: ${error.message}`);
    }
  }

  /**
   * 여러 사이트의 보고서를 일괄 스크래핑
   */
  async scrapeMultipleReports(urls: string[]): Promise<ReportData[]> {
    const reports = await Promise.allSettled(
      urls.map((url) => this.scrapeReport(url)),
    );

    return reports
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<ReportData>).value);
  }

  /**
   * 특정 사이트의 최신 보고서 목록 가져오기
   */
  async getLatestReports(
    siteUrl: string,
    limit: number = 10,
  ): Promise<ReportData[]> {
    try {
      const response = await axios.get(siteUrl);
      const $ = cheerio.load(response.data);

      const reportLinks: string[] = [];

      // 사이트별 링크 추출 로직 (예시)
      $('a[href*="report"], a[href*="analysis"]').each((_, element) => {
        const href = $(element).attr("href");
        if (href) {
          const fullUrl = href.startsWith("http") ? href : `${siteUrl}${href}`;
          reportLinks.push(fullUrl);
        }
      });

      // 중복 제거 및 제한
      const uniqueLinks = [...new Set(reportLinks)].slice(0, limit);

      return await this.scrapeMultipleReports(uniqueLinks);
    } catch (error) {
      throw new Error(
        `Failed to get latest reports from ${siteUrl}: ${error.message}`,
      );
    }
  }
}
