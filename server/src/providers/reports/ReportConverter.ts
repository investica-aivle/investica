import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { ReportBaseProvider } from "./ReportBaseProvider";
import PdfConversionResult, { ReportsJsonData } from "@models/Reports";
import { PDFDocument } from 'pdf-lib';

@Injectable()
export class ReportConverter {
  constructor(private readonly baseProvider: ReportBaseProvider) {}

  /**
   * JSON 파일을 통해 마크다운 변환이 필요한 보고서들을 찾아서 변환
   */
  public async convertReportsFromJson(
    jsonFilePath: string = "./downloads/reports.json",
    mdFolderPath: string = "./downloads/markdown",
  ): Promise<PdfConversionResult[]> {
    console.log(`JSON 기반 마크다운 변환 시작`);
    console.log(`JSON 파일: ${jsonFilePath}`);
    console.log(`마크다운 폴더: ${mdFolderPath}`);

    const results: PdfConversionResult[] = [];

    try {
      // JSON 파일 읽기
      if (!fs.existsSync(jsonFilePath)) {
        console.log(`JSON 파일이 없습니다: ${jsonFilePath}`);
        return results;
      }

      const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
      const reportsData: ReportsJsonData = JSON.parse(jsonContent);

      // mdFileName이 null인 보고서들 찾기
      const reportsNeedingConversion = reportsData.reports.filter(
        (report) => report.mdFileName === null,
      );

      console.log(`변환할 보고서 개수: ${reportsNeedingConversion.length}`);

      // 출력 디렉토리 생성
      if (!fs.existsSync(mdFolderPath)) {
        fs.mkdirSync(mdFolderPath, { recursive: true });
      }

      // 각 보고서를 file_url로 변환
      for (const report of reportsNeedingConversion) {
        console.log(`\n변환 중: ${report.title}`);

        const result = await this.convertPdfFromUrl(
          report.downloadUrl,
          report.id, // pdfFileName 대신 id 사용
          mdFolderPath,
        );

        if (result.success) {
          console.log(`변환 성공: ${result.fileName}`);
        } else {
          console.log(`변환 실패: ${result.error}`);
        }

        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `\n📊 변환 결과: ${results.length}개 중 ${successCount}개 성공`,
      );

      // JSON 파일 업데이트
      await this.updateReportsJsonFromResults(jsonFilePath, results);

      return results;
    } catch (error) {
      console.error(`JSON 기반 변환 실패:`, error);
      return results;
    }
  }

  /**
   * URL에서 PDF 변환 base64 인코딩
   */
  public async convertPdfFromUrl(
    downloadUrl: string,
    pdfFileName: string,
    mdFolderPath: string,
  ): Promise<PdfConversionResult> {
    let tempPdfPath: string | null = null;
    try {
      console.log(`URL에서 변환 시작: ${pdfFileName}`);

      tempPdfPath = await this.downloadPdf(downloadUrl);
      const pdfBuffer = fs.readFileSync(tempPdfPath);
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const totalPages = pdfDoc.getPageCount();
      console.log(`  - PDF 총 페이지: ${totalPages}`);

      if (totalPages === 0) {
        throw new Error("PDF에 페이지가 없습니다.");
      }

      const chunks: { start: number; end: number }[] = [];
      const chunkSize = 20;

      for (let i = 0; i < totalPages; i += chunkSize) {
        const start = i;
        if(totalPages - i <= chunkSize + 5){
          const end = totalPages;
          chunks.push({ start, end });
          break;
        }
        const end = Math.min(i + chunkSize, totalPages);
        chunks.push({ start, end });
      }


      const partialSummaries: string[] = [];
      for (const chunk of chunks) {
        const { start, end } = chunk;
        console.log(`  - ${start + 1} ~ ${end} 페이지 요약 중...`);

        const chunkPdfDoc = await PDFDocument.create();
        const pageIndices = Array.from({length: end - start}, (_, k) => start + k);
        const copiedPages = await chunkPdfDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => chunkPdfDoc.addPage(page));
        
        const chunkPdfBytes = await chunkPdfDoc.save();
        const chunkBase64 = Buffer.from(chunkPdfBytes).toString("base64");

        const filePart = { inlineData: { mimeType: "application/pdf", data: chunkBase64 } };

        const chunkPrompt = `
첨부된 PDF는 금융 보고서의 전체 ${totalPages}페이지 중 ${start + 1} - ${end} 페이지 입니다.
전체 페이지를 고려하여 너무 길어지지 않게 하십시오.

이 문서의 내용을 가능한 한 정확하고 자세하게 쓰되 요약하여 정리하십시오.
보고서의 흐름과 세부 내용을 충실히 반영해 작성하십시오.
작성자의 해석이나 주관적 판단 없이, PDF에 포함된 내용을 기반으로 정리하십시오.
형식은 마크다운을 계층형식으로 작성하십시오.

그래프 같은 것 들이 있는 경우 각 그래프 마다 자세한 지표를뽑아내거나 평가한정보가 있어야 함
제목이나 항목 구분 하며 본문 내용을 작성하십시오.

문서 외적인 설명, 요약, 해설, 주석은 포함하지 마십시오.
보고서의 주 내용이 아닌 제목, 작성자, 날짜와 같은 부가 정보는 모두 제외하십시오.

            
`;

        const partialSummary = await this.baseProvider.callGenerativeModel([chunkPrompt, filePart]);
        partialSummaries.push(partialSummary);
      }

      let finalMarkdown: string;
      if (partialSummaries.length === 0) {
        throw new Error("부분 요약을 생성하지 못했습니다.");
      } else if (partialSummaries.length === 1) {
        console.log("  - 단일 청크, 최종 요약으로 사용합니다.");
        finalMarkdown = partialSummaries[0];
      } else {
        console.log(`  - ${partialSummaries.length}개의 부분 요약을 최종 요약으로 합치는 중...`);
        const reducePrompt = `
          다음은 하나의 금융 보고서를 페이지 순서대로 요약한 여러 개의 부분 요약입니다.
          이들을 모두 종합하여, 전체 보고서의 흐름과 논리를 완벽하게 반영하는 하나의 상세하고 일관된 마크다운 문서를 만들어주세요.
          각 부분의 핵심 내용이 누락되지 않도록 하고, 전체적인 구조를 잘 정리하여 최종 결과물을 작성하세요.
          최종 결과물은 마크다운 형식이어야 합니다.
          
          내용이 너무 길어지지 않게 주의하세요.
          
          문서 외적인 설명, 요약, 해설, 주석은 포함하지 마십시오.
          보고서 제목, 작성자, 날짜와 같은 부가 정보는 모두 제외하십시오.
          
          --- 부분 요약 목록 ---
          ${partialSummaries.join("\n\n---\n\n")}
          --- 요약 끝 ---
        `;
        finalMarkdown = await this.baseProvider.callGenerativeModel(reducePrompt);
      }

      // 5. 최종 마크다운 파일 저장
      const markdownFileName = `${pdfFileName.replace(".pdf", "")}.md`;
      const markdownFilePath = path.join(mdFolderPath, markdownFileName);
      fs.writeFileSync(markdownFilePath, finalMarkdown, "utf8");
      console.log(`마크다운 파일 저장 완료: ${markdownFilePath}`);

      return {
        markdown: finalMarkdown,
        fileName: markdownFileName,
        success: true,
      };
    } catch (error) {
      console.error(`URL 변환 실패 (${pdfFileName}):`, error);
      return {
        markdown: "",
        fileName: "",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (tempPdfPath) {
        try {
          fs.unlinkSync(tempPdfPath);
        } catch (err: any) {
          console.error(`임시 파일 삭제 실패: ${tempPdfPath}`, err);
        }
      }
    }
  }

  private async downloadPdf(url: string): Promise<string> {
    const filename = `temp_document_${Date.now()}.pdf`;
    const outputPath = path.join(this.baseProvider.tempDir, filename);

    try {
      console.log(`PDF 다운로드 중: ${url}`);

      const response = await this.baseProvider.httpService.axiosRef.get(url, {
        responseType: "arraybuffer",
      });

      if (response.status !== 200) {
        throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
      }

      fs.writeFileSync(outputPath, Buffer.from(response.data));
      console.log(`PDF 다운로드 완료: ${outputPath}`);
      return outputPath;
    } catch (error: any) {
      console.error(`PDF 다운로드 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException(`PDF 다운로드 실패: ${error.message}`);
    }
  }

  /**
   * 변환 결과로 JSON 파일 업데이트
   */
  private async updateReportsJsonFromResults(
    jsonFilePath: string,
    conversionResults: PdfConversionResult[],
  ): Promise<void> {
    try {
      const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
      const reportsData: ReportsJsonData = JSON.parse(jsonContent);

      const successfulConversions = conversionResults.filter((r) => r.success);

      for (const conversion of successfulConversions) {
        const reportId = conversion.fileName.replace(".md", "");

        const reportIndex = reportsData.reports.findIndex(
          (report) => report.id === reportId,
        );

        if (reportIndex !== -1) {
          reportsData.reports[reportIndex].mdFileName = conversion.fileName;
        }
      }

      reportsData.lastMarkdownUpdate = new Date().toISOString();

      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(reportsData, null, 2),
        "utf8",
      );
      console.log(`JSON 파일 업데이트 완료: ${successfulConversions.length}개`);
    } catch (error) {
      console.error(`JSON 파일 갱신 실패:`, error);
    }
  }
}