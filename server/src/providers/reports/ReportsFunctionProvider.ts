import { Injectable } from "@nestjs/common";
import { basename } from "path";

import { MiraeAssetScraperProvider } from "./MiraeAssetScraperProvider";
import { PerplexityPdfConverterProvider } from "./PerplexityPdfConverterProvider";

/**
 * Reports Function Provider
 *
 * 내부적으로 사용되는 보고서 관련 함수들을 제공합니다.
 * Agentica가 직접 호출하지 않고 Service에서 사용합니다.
 */
@Injectable()
export class ReportsFunctionProvider {
  constructor(
    private readonly miraeAssetScraperProvider: MiraeAssetScraperProvider,
    private readonly perplexityPdfConverterProvider: PerplexityPdfConverterProvider,
  ) {}

  /**
   * 최근 증권보고서 가져와서 변환하기
   */
  public async getRecentReportsAndConvert(input: {
    keywords?: string[];
    limit?: number;
    outputDir?: string;
  }): Promise<{
    message: string;
    reports: Array<{
      title: string;
      date: string;
      author: string;
      markdown: string;
      markdownFileName: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    try {
      const keywords = input.keywords || ["증권", "주식시장"];
      const limit = input.limit || 3;
      const outputDir = input.outputDir || "./downloads";

      // 1. 키워드로 보고서 검색
      const foundReports =
        await this.miraeAssetScraperProvider.getLatestReportsByKeywords(
          keywords,
          limit,
        );

      if (foundReports.length === 0) {
        return {
          message: `"${keywords.join(", ")}" 키워드로 검색된 보고서가 없습니다.`,
          reports: [],
        };
      }

      const processedReports = [];

      // 2. 각 보고서 다운로드 및 변환
      for (const report of foundReports) {
        try {
          // PDF 다운로드
          const pdfFilePath = await this.miraeAssetScraperProvider.downloadPdf(
            report.downloadUrl,
            outputDir,
          );

          // 마크다운으로 변환
          const conversionResult =
            await this.perplexityPdfConverterProvider.convertPdfToMarkdown(
              pdfFilePath,
              `${outputDir}/markdown`,
            );

          processedReports.push({
            title: report.title,
            date: report.date,
            author: report.author,
            markdown: conversionResult.markdown,
            markdownFileName: conversionResult.fileName,
            success: conversionResult.success,
            error: conversionResult.error,
          });
        } catch (error) {
          processedReports.push({
            title: report.title,
            date: report.date,
            author: report.author,
            markdown: "",
            markdownFileName: "",
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const successCount = processedReports.filter((r) => r.success).length;

      return {
        message: `"${keywords.join(", ")}" 키워드로 ${foundReports.length}개의 보고서를 찾았습니다. ${successCount}개가 성공적으로 변환되었습니다.`,
        reports: processedReports,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: `보고서 검색 및 변환 중 오류가 발생했습니다: ${errorMessage}`,
        reports: [],
      };
    }
  }

  /**
   * 보고서 다운로드 및 변환
   */
  public async downloadAndConvertReport(input: {
    downloadUrl: string;
    outputDir?: string;
  }): Promise<{
    message: string;
    title?: string;
    markdown: string;
    markdownFileName: string;
    success: boolean;
    error?: string;
  }> {
    try {
      const outputDir = input.outputDir || "./downloads";

      // PDF 다운로드
      const pdfFilePath = await this.miraeAssetScraperProvider.downloadPdf(
        input.downloadUrl,
        outputDir,
      );

      // 마크다운으로 변환
      const conversionResult =
        await this.perplexityPdfConverterProvider.convertPdfToMarkdown(
          pdfFilePath,
          `${outputDir}/markdown`,
        );

      return {
        message: "보고서가 성공적으로 다운로드되고 변환되었습니다.",
        title: basename(pdfFilePath, ".pdf"),
        markdown: conversionResult.markdown,
        markdownFileName: conversionResult.fileName,
        success: conversionResult.success,
        error: conversionResult.error,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: `보고서 다운로드 및 변환 중 오류가 발생했습니다: ${errorMessage}`,
        markdown: "",
        markdownFileName: "",
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * PDF 파일을 마크다운으로 변환
   */
  public async convertPdfToMarkdown(input: {
    pdfFilePath: string;
    outputDir?: string;
  }): Promise<{
    message: string;
    markdown: string;
    fileName: string;
    success: boolean;
    error?: string;
  }> {
    try {
      const result =
        await this.perplexityPdfConverterProvider.convertPdfToMarkdown(
          input.pdfFilePath,
          input.outputDir || "./downloads/markdown",
        );

      return {
        message: result.success
          ? "PDF가 성공적으로 마크다운으로 변환되었습니다."
          : `PDF 변환 실패: ${result.error}`,
        markdown: result.markdown,
        fileName: result.fileName,
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: `PDF 변환 중 오류가 발생했습니다: ${errorMessage}`,
        markdown: "",
        fileName: "",
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 여러 PDF 파일을 일괄 변환
   */
  public async convertMultiplePdfsToMarkdown(input: {
    pdfFilePaths: string[];
    outputDir?: string;
  }): Promise<{
    message: string;
    results: Array<{
      markdown: string;
      fileName: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    try {
      const results =
        await this.perplexityPdfConverterProvider.convertMultiplePdfsToMarkdown(
          input.pdfFilePaths,
          input.outputDir || "./downloads/markdown",
        );

      const successCount = results.filter((r) => r.success).length;

      return {
        message: `${input.pdfFilePaths.length}개의 PDF 파일 중 ${successCount}개가 성공적으로 변환되었습니다.`,
        results,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: `PDF 일괄 변환 중 오류가 발생했습니다: ${errorMessage}`,
        results: [],
      };
    }
  }

  /**
   * Earnings Revision 보고서 가져오기
   */
  public async getEarningsRevisionReports(input: {
    limit?: number;
    outputDir?: string;
  }): Promise<{
    message: string;
    reports: Array<{
      title: string;
      date: string;
      author: string;
      markdown: string;
      markdownFileName: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    try {
      const limit = input.limit || 5;
      const outputDir = input.outputDir || "./downloads";

      const foundReports =
        await this.miraeAssetScraperProvider.getLatestReportsByKeywords(
          ["Earnings Revision"],
          limit,
        );

      if (foundReports.length === 0) {
        return {
          message: "Earnings Revision 보고서를 찾을 수 없습니다.",
          reports: [],
        };
      }

      const processedReports = [];

      for (const report of foundReports) {
        try {
          const pdfFilePath = await this.miraeAssetScraperProvider.downloadPdf(
            report.downloadUrl,
            outputDir,
          );

          const conversionResult =
            await this.perplexityPdfConverterProvider.convertPdfToMarkdown(
              pdfFilePath,
              `${outputDir}/markdown`,
            );

          processedReports.push({
            title: report.title,
            date: report.date,
            author: report.author,
            markdown: conversionResult.markdown,
            markdownFileName: conversionResult.fileName,
            success: conversionResult.success,
            error: conversionResult.error,
          });
        } catch (error) {
          processedReports.push({
            title: report.title,
            date: report.date,
            author: report.author,
            markdown: "",
            markdownFileName: "",
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const successCount = processedReports.filter((r) => r.success).length;

      return {
        message: `최근 Earnings Revision 보고서 ${foundReports.length}개를 찾았습니다. ${successCount}개가 성공적으로 변환되었습니다.`,
        reports: processedReports,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: `Earnings Revision 보고서 검색 중 오류가 발생했습니다: ${errorMessage}`,
        reports: [],
      };
    }
  }
}
