import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

export interface MiraeAssetReport {
  title: string;
  date: string;
  author: string;
  downloadUrl: string;
  fileName: string;
  category: string;
}

@Injectable()
export class MiraeAssetScraperService {
  private readonly baseUrl = "https://securities.miraeasset.com";
  private readonly reportsUrl =
    "https://securities.miraeasset.com/bbs/board/message/list.do?categoryId=1527";

  /**
   * 미래에셋증권 보고서 목록에서 특정 키워드가 포함된 보고서들 스크래핑
   */
  async scrapeReportsByKeywords(
    keywords: string[],
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

      // 테이블에서 각 행을 찾기
      $("table tr").each((_, element) => {
        const $row = $(element);

        // 제목 열에서 키워드 확인
        const titleElement = $row.find("a");
        const title = titleElement.text().trim();

        // 키워드가 포함된 제목인지 확인
        const hasKeyword = keywords.some((keyword) =>
          title.toLowerCase().includes(keyword.toLowerCase()),
        );

        if (hasKeyword && title) {
          // 날짜, 작성자, 다운로드 링크 추출
          const date = $row.find("td").eq(0).text().trim();
          const author = $row.find("td").eq(2).text().trim();

          // 다운로드 링크 추출 (개선된 방식)
          const downloadLink = this.extractDownloadUrl($row);

          if (downloadLink) {
            reports.push({
              title,
              date,
              author,
              downloadUrl: downloadLink,
              fileName: this.extractFileName(downloadLink),
              category: this.detectCategory(title),
            });
          }
        }
      });

      return reports;
    } catch (error) {
      throw new Error(`Failed to scrape Mirae Asset reports: ${error.message}`);
    }
  }

  /**
   * 다운로드 URL 추출 (개선된 방식)
   */
  private extractDownloadUrl(
    $row: cheerio.Cheerio<cheerio.Element>,
  ): string | null {
    // 방법 1: href에 download와 pdf가 포함된 링크 찾기
    const downloadLinks = $row.find(
      'a[href*="download"][href*=".pdf"], a[href*="download"][href*="pdf"]',
    );

    if (downloadLinks.length > 0) {
      const href = downloadLinks.first().attr("href");
      if (href) {
        // 상대 경로인 경우 절대 경로로 변환
        return href.startsWith("http") ? href : `${this.baseUrl}${href}`;
      }
    }

    // 방법 2: onclick 속성에서 URL 추출 (기존 방식)
    const onclickElements = $row.find('a[onclick*="download"]');
    if (onclickElements.length > 0) {
      const onclick = onclickElements.attr("onclick");
      if (onclick) {
        const match = onclick.match(/nv\.Popup\.open\('([^']+)'/);
        if (match) {
          return match[1];
        }
      }
    }

    // 방법 3: 일반적인 PDF 링크 찾기
    const pdfLinks = $row.find('a[href*=".pdf"]');
    if (pdfLinks.length > 0) {
      const href = pdfLinks.first().attr("href");
      if (href) {
        return href.startsWith("http") ? href : `${this.baseUrl}${href}`;
      }
    }

    return null;
  }

  /**
   * 파일명 추출
   */
  private extractFileName(downloadUrl: string): string {
    const urlParts = downloadUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];
    return fileName.split("?")[0]; // 쿼리 파라미터 제거
  }

  /**
   * 카테고리 감지
   */
  private detectCategory(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("earnings revision")) {
      return "Earnings Revision";
    } else if (lowerTitle.includes("credit market weekly")) {
      return "Credit Market Weekly";
    } else if (lowerTitle.includes("thematic radar")) {
      return "Thematic Radar";
    } else if (lowerTitle.includes("fixed income")) {
      return "Fixed Income";
    } else {
      return "Other";
    }
  }

  /**
   * PDF 파일 다운로드
   */
  async downloadPdf(
    downloadUrl: string,
    outputDir: string = "./downloads",
  ): Promise<string> {
    try {
      // 출력 디렉토리 생성
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const response = await axios.get(downloadUrl, {
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      // 파일명 추출
      const fileName = this.extractFileName(downloadUrl);
      const filePath = path.join(outputDir, fileName);

      // 파일 스트림으로 저장
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
      });
    } catch (error) {
      throw new Error(
        `Failed to download PDF from ${downloadUrl}: ${error.message}`,
      );
    }
  }

  /**
   * 여러 보고서 일괄 다운로드
   */
  async downloadMultipleReports(
    reports: MiraeAssetReport[],
    outputDir: string = "./downloads",
  ): Promise<string[]> {
    const downloadedFiles: string[] = [];

    for (const report of reports) {
      try {
        const filePath = await this.downloadPdf(report.downloadUrl, outputDir);
        downloadedFiles.push(filePath);
        console.log(`Downloaded: ${report.title} -> ${filePath}`);
      } catch (error) {
        console.error(`Failed to download ${report.title}: ${error.message}`);
      }
    }

    return downloadedFiles;
  }

  /**
   * 특정 키워드의 최신 보고서만 가져오기
   */
  async getLatestReportsByKeywords(
    keywords: string[],
    limit: number = 5,
  ): Promise<MiraeAssetReport[]> {
    const allReports = await this.scrapeReportsByKeywords(keywords);

    // 날짜순으로 정렬하고 최신순으로 반환
    return allReports
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}
