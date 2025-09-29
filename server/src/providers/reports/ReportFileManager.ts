import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import { MiraeAssetReport, ReportsJsonData } from "@models/Reports";

@Injectable()
export class ReportFileManager {
  /**
   * JSON을 이용해서 마크다운 날짜순 정렬해서 리턴
   */
  public getMarkdownFilesFromJson(jsonFilePath: string): MiraeAssetReport[] {
    try {
      if (!fs.existsSync(jsonFilePath)) {
        console.log(`JSON 파일이 없습니다: ${jsonFilePath}`);
        return [];
      }

      const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
      const reportsData: ReportsJsonData = JSON.parse(jsonContent);

      // mdFileName이 있는 보고서들만 필터링하고 정렬
      const reportsWithMarkdown = reportsData.reports
        .filter((report) => report.mdFileName !== null)
        .filter((report) =>
          fs.existsSync(`./downloads/markdown/${report.mdFileName}`),
        ) // 실제 파일이 존재하는지 확인
        .sort((a, b) => {
          // 날짜순 정렬 (최신순)
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

      console.log(`JSON에서 ${reportsWithMarkdown.length}개의 마크다운 파일을 찾았습니다.`);
      return reportsWithMarkdown;
    } catch (error) {
      console.error(`JSON에서 마크다운 파일 읽기 실패:`, error);
      return [];
    }
  }

  /**
   * 마크다운 파일 내용 읽기
   */
  public readLatestMarkdownFiles(
    sortedFiles: MiraeAssetReport[],
    options: {
      contentLengthLimit?: number;
      shouldLimitLength?: boolean;
    } = {},
  ) {
    const { contentLengthLimit = 2000, shouldLimitLength = true } = options;
    const fileContents = [];

    for (const file of sortedFiles) {
      try {
        if (!file.mdFileName) continue;

        const filePath = `./downloads/markdown/${file.mdFileName}`;
        const content = fs.readFileSync(filePath, "utf8");
        const finalContent = shouldLimitLength
          ? content.substring(0, contentLengthLimit)
          : content;

        fileContents.push({
          fileName: file.mdFileName,
          content: finalContent,
        });
      } catch (error) {
        console.error(`Error reading file ${file.mdFileName}:`, error);
      }
    }

    return fileContents;
  }

  /**
   * 최신 마크다운 파일들을 가져오기
   */
  public getLatestMarkdownFiles(
    jsonFilePath: string = "./downloads/reports.json",
    limit: number = 5,
    options: {
      contentLengthLimit?: number;
      shouldLimitLength?: boolean;
    } = {},
  ): {
    limitedFiles: MiraeAssetReport[];
    fileContents: { fileName: string; content: string }[];
  } {
    // 1. 마크다운 파일들 읽기 및 정렬
    const sortedFiles = this.getMarkdownFilesFromJson(jsonFilePath);

    if (sortedFiles.length === 0) {
      return {
        limitedFiles: [],
        fileContents: [],
      };
    }

    // 2. limit만큼 자르기
    const limitedFiles = sortedFiles.slice(0, limit);

    console.log(`최신 ${limitedFiles.length}개의 마크다운 파일을 선택했습니다.`);
    // 3. 파일 내용 읽기
    const fileContents = this.readLatestMarkdownFiles(limitedFiles, options);

    return {
      limitedFiles,
      fileContents,
    };
  }

  /**
   * 참조 파일 목록 생성
   */
  public createReferencedFiles(
    sortedFiles: MiraeAssetReport[],
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ): Array<{
      fileName: string;
      date: string;
      title: string;
      content: string;
    }> {
    const referencedFiles = [];

    for (const file of sortedFiles) {
      if (!file.mdFileName) continue;

      const content = fileContents.find(
        (fc) => fc.fileName === file.mdFileName,
      );
      if (content) {
        referencedFiles.push({
          fileName: file.mdFileName,
          date: file.date, // 이미 YYYY-MM-DD 형식
          title: file.title,
          content: content.content,
        });
      }
    }

    return referencedFiles;
  }
}
