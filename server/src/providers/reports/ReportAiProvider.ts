import { GoogleGenerativeAI } from "@google/generative-ai";
import PdfConversionResult, {
  Keyword,
  KeywordCacheData,
  KeywordSummaryResult,
  MiraeAssetReport,
  ReportsJsonData,
} from "@models/Reports";
import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
/**
 * Report AI Provider
 *
 * Google Gemini AI를 사용하여 PDF를 마크다운으로 변환하는 기능을 제공합니다.
 * 내부적으로 사용되는 Provider입니다.
 */
@Injectable()
export class ReportAiProvider {
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>("GOOGLE_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException("Google API Key not found in configuration.");
    } else {
      console.log(`GOOGLE_API_KEY 설정됨`);
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // temp_files 디렉토리 생성
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      console.log(`임시 파일 디렉토리 생성: ${this.tempDir}`);
    }
  }

  /**
   * 최신 마크다운 파일들을 가져오기
   */
  public async getLatestMarkdownFiles(
    jsonFilePath: string = "./downloads/reports.json",
    limit: number = 5,
    options: {
      contentLengthLimit?: number;
      shouldLimitLength?: boolean;
    } = {},
  ): Promise<{
    limitedFiles: any[];
    fileContents: any[];
  }> {
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

    // 3. 파일 내용 읽기
    const fileContents = this.readLatestMarkdownFiles(limitedFiles, options);

    return {
      limitedFiles,
      fileContents,
    };
  }

  /**
   * 최신마크다운문서들을 확인하고 요약
   */
  public async summarizeLatestMarkdownFiles(
    jsonFilePath: string = "./downloads/reports.json",
    limit: number = 5,
  ): Promise<{
    message: string;
    summary: string;
    referencedFiles: Array<{
      fileName: string;
      date: string;
      title: string;
      content: string;
    }>;
  }> {
    try {
      console.log("summarizeLatestMarkdownFiles");

      const { limitedFiles, fileContents } = await this.getLatestMarkdownFiles(
        jsonFilePath,
        limit,
      );

      if (fileContents.length === 0) {
        return {
          message: "마크다운 파일이 없습니다.",
          summary: "",
          referencedFiles: [],
        };
      }

      // 3. AI 요약 요청
      const summary = await this.requestAISummary(fileContents);

      return {
        message: `${fileContents.length}개의 최신 마크다운 파일이 성공적으로 요약되었습니다.`,
        summary,
        referencedFiles: this.createReferencedFiles(limitedFiles, fileContents),
      };
    } catch (error) {
      console.error("Error summarizing markdown files:", error);
      return {
        message: `요약 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        summary: "",
        referencedFiles: [],
      };
    }
  }

  /**
   * 키워드 기반 짧은 요약 생성
   */
  public async generateKeywordSummary(
    jsonFilePath: string = "./downloads/reports.json",
    limit: number = 5,
  ): Promise<KeywordSummaryResult> {
    try {
      console.log("generateKeywordSummary");

      const { limitedFiles, fileContents } = await this.getLatestMarkdownFiles(
        jsonFilePath,
        limit,
        { contentLengthLimit: 3000, shouldLimitLength: true },
      );

      if (fileContents.length === 0) {
        return {
          message: "마크다운 파일이 없습니다.",
          keywords: [],
          referencedFiles: [],
        };
      }

      // 캐시 확인
      const cacheResult = this.checkKeywordCache(limitedFiles);
      if (cacheResult.isValid) {
        console.log("캐시된 키워드 요약 사용");
        return {
          message: `${fileContents.length}개의 최신 마크다운 파일에서 키워드를 추출했습니다. (캐시됨)`,
          keywords: cacheResult.keywords,
          referencedFiles: limitedFiles,
        };
      }

      // AI 키워드 요약 요청
      const keywordData = await this.requestAIKeywordSummary(fileContents);

      // 캐시 저장
      await this.saveKeywordCache(keywordData, limitedFiles);

      return {
        message: `${fileContents.length}개의 최신 마크다운 파일에서 키워드를 추출했습니다.`,
        keywords: keywordData,
        referencedFiles: limitedFiles,
      };
    } catch (error) {
      console.error("Error generating keyword summary:", error);
      return {
        message: `키워드 요약 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        keywords: [],
        referencedFiles: [],
      };
    }
  }



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
   * AI 요약 요청 (직접 API 사용)
   */
  private async requestAISummary(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const summaryPrompt = this.createSummaryPrompt(fileContents);
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * AI 키워드 요약 요청
   */
  private async requestAIKeywordSummary(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const keywordPrompt = this.createKeywordPrompt(fileContents);
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(keywordPrompt);
    const response = await result.response;
    const responseText = response.text();

    return this.parseKeywordResponse(responseText);
  }

  /**
   * 요약 프롬프트 생성
   */
  private createSummaryPrompt(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    return `다음 ${fileContents.length}개의 최신 증권보고서들을 요약해줘:\n\n${fileContents
  .map(
    (file, index) => `\n**${index + 1}. ${file.fileName}**\n${file.content.substring(0, 500)}...\n`,
  )
  .join("\n")}\n\n위 보고서들의 주요 내용을 종합적으로 요약해주세요. 다음 사항들을 포함해주세요:\n1. 전체적인 시장 동향\n2. 주요 투자 포인트\n3. 리스크 요인\n4. 향후 전망\n\n간결하고 명확하게 요약해주세요.`;
  }

  /**
   * 키워드 요약 프롬프트 생성
   */
  private createKeywordPrompt(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
    const formatInstructions = this.getKeywordFormatInstructions();

    return `다음 ${fileContents.length}개의 최신 증권보고서들에서 주식시장에 영향을 줄 핵심 키워드를 추출해줘:\n\n${fileContents
  .map(
    (file, index) => `\n**${index + 1}. ${file.fileName}**\n${file.content.substring(0, 500)}...\n`,
  )
  .join("\n")}\n\n위 보고서들에서 주식시장에 직접적인 영향을 줄 수 있는 핵심 키워드 3-8개를 추출해주세요.\n\n${formatInstructions}\n\n각 키워드는 구체적이고 임팩트 있는 것들로 추출해주세요.`;
  }

  /**
   * 키워드 응답 파싱
   */
  private parseKeywordResponse(responseText: string): Keyword[] {
    try {
      // JSON 블록 추출
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        console.warn(
          "JSON 블록을 찾을 수 없습니다. 전체 텍스트에서 JSON 추출 시도...",
        );
        // JSON 블록이 없으면 전체 텍스트에서 JSON 배열 찾기
        const arrayMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!arrayMatch) {
          console.error("유효한 JSON 배열을 찾을 수 없습니다.");
          return [];
        }
        const jsonStr = arrayMatch[0];
        const parsed = JSON.parse(jsonStr);
        return this.validateKeywordArray(parsed);
      }

      const jsonStr = jsonMatch[1];
      const parsed = JSON.parse(jsonStr);
      return this.validateKeywordArray(parsed);
    } catch (error) {
      console.error("키워드 응답 파싱 실패:", error);
      return [];
    }
  }

  /**
   * 키워드 배열 검증
   */
  private validateKeywordArray(parsed: any): Keyword[] {
    if (!Array.isArray(parsed)) {
      console.error("파싱된 데이터가 배열이 아닙니다.");
      return [];
    }

    return parsed
      .filter((item) => {
        return (
          item &&
          typeof item === "object" &&
          typeof item.icon === "string" &&
          typeof item.keyword === "string" &&
          typeof item.description === "string" &&
          ["positive", "negative", "neutral"].includes(item.impact)
        );
      })
      .map((item) => ({
        icon: item.icon,
        keyword: item.keyword,
        description: item.description,
        impact: item.impact as "positive" | "negative" | "neutral",
      }));
  }

  /**
   * 키워드 캐시 확인
   */
  private checkKeywordCache(files: MiraeAssetReport[]): {
    isValid: boolean;
    keywords: Keyword[];
  } {
    try {
      const cachePath = "./downloads/summary/keyword_cache.json";

      if (!fs.existsSync(cachePath)) {
        return { isValid: false, keywords: [] };
      }

      const cacheContent = fs.readFileSync(cachePath, "utf8");
      const cache = JSON.parse(cacheContent);

      // 현재 파일 ID들
      const currentFileIds = files.map((f) => f.id);

      // 캐시된 파일 ID들
      const cachedFileIds = cache.referencedFiles.map((f: any) => f.id);

      // 현재 파일들이 모두 캐시에 포함되어 있는지 확인
      const allFilesInCache = currentFileIds.every((id) =>
        cachedFileIds.includes(id),
      );

      if (!allFilesInCache) {
        console.log("새로운 파일이 포함되어 있어 캐시 무효화");
        return { isValid: false, keywords: [] };
      }

      console.log("모든 파일이 캐시에 포함되어 있어 캐시 사용");
      return { isValid: true, keywords: cache.keywords };
    } catch (error) {
      console.error("캐시 확인 중 오류:", error);
      return { isValid: false, keywords: [] };
    }
  }

  /**
   * 키워드 캐시 저장
   */
  private async saveKeywordCache(
    keywords: Keyword[],
    files: MiraeAssetReport[],
  ): Promise<void> {
    try {
      const summaryDir = "./downloads/summary";
      const cachePath = `${summaryDir}/keyword_cache.json`;

      // summary 디렉토리 생성
      if (!fs.existsSync(summaryDir)) {
        fs.mkdirSync(summaryDir, { recursive: true });
        console.log(`요약 디렉토리 생성: ${summaryDir}`);
      }

      // 기존 캐시 읽기 (있다면)
      let existingCache: KeywordCacheData = {
        keywords: [],
        referencedFiles: [],
        updatedAt: "",
      };
      if (fs.existsSync(cachePath)) {
        try {
          const cacheContent = fs.readFileSync(cachePath, "utf8");
          existingCache = JSON.parse(cacheContent);
        } catch (error) {
          console.warn("기존 캐시 읽기 실패, 새로 생성합니다.");
        }
      }

      // 기존 파일들과 새 파일들 병합 (중복 제거)
      const existingFileIds = new Set(
        existingCache.referencedFiles.map((f: any) => f.id),
      );
      const newFiles = files.filter((f) => !existingFileIds.has(f.id));

      const allFiles = [...existingCache.referencedFiles, ...newFiles];

      const cacheData: KeywordCacheData = {
        keywords,
        referencedFiles: allFiles,
        updatedAt: new Date().toISOString().split("T")[0],
      };

      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), "utf8");
      console.log(`키워드 캐시 저장 완료: ${cachePath} (총 ${allFiles.length}개 파일)`);
    } catch (error) {
      console.error("캐시 저장 중 오류:", error);
    }
  }

  /**
   * 참조 파일 목록 생성
   */
  private createReferencedFiles(
    sortedFiles: MiraeAssetReport[],
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ) {
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

  /**
   * 파일명에서 날짜 추출 (yyyymmdd_title_id 형식)
   */
  private extractDateFromFileName(fileName: string): Date | null {
    try {
      // yyyymmdd_title_id.md 형식에서 날짜 부분 추출
      const match = fileName.match(/^(\d{8})_/);
      if (match) {
        const dateStr = match[1];
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1; // 월은 0부터 시작
        const day = parseInt(dateStr.substring(6, 8));

        return new Date(year, month, day);
      }
      return null;
    } catch (error) {
      console.error(`Error extracting date from filename ${fileName}:`, error);
      return null;
    }
  }

  /**
   * 키워드 스키마의 format_instructions 생성 (Pydantic parser와 유사)
   */
  private getKeywordFormatInstructions(): string {
    return `The output should be formatted as a JSON array that conforms to the following schema:\n\n{\n  "type": "array",\n  "items": {\n    "type": "object", \n    "properties": {\n      "icon": { "type": "string", "description": "적절한 이모지 아이콘" },\n      "keyword": { "type": "string", "description": "주식시장에 영향을 주는 핵심 키워드" },\n      "description": { "type": "string", "description": "키워드에 대한 한두 줄 설명" },\n      "impact": { \n        "type": "string", \n        "enum": ["positive", "negative", "neutral"],\n        "description": "키워드가 주식시장에 미치는 영향"\n      }\n    },\n    "required": ["icon", "keyword", "description", "impact"]\n  }\n}\n\nExample output:\n[\n  {\n    "icon": "🚨",\n    "keyword": "트럼프 관세 35% 선언",\n    "description": "미국 대선 후보 트럼프가 중국산 수입품에 35% 관세 부과를 선언하여 무역 긴장 고조",\n    "impact": "negative"\n  },\n  {\n    "icon": "📈",\n    "keyword": "반도체 수요 급증", \n    "description": "AI 서버 수요 증가로 인한 메모리 반도체 가격 상승 전망",\n    "impact": "positive"\n  }\n]`;
  }

  private readonly tempDir = path.join(os.tmpdir(), "temp_files");

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
      // API 키 확인
      if (!this.genAI) {
        console.error("Gemini API not configured");
        return {
          markdown: "",
          fileName: "",
          success: false,
          error: "Gemini API not configured",
        };
      }

      console.log(`URL에서 변환 시작: ${pdfFileName}`);
      console.log(`다운로드 URL: ${downloadUrl}`);

      //pdf 다운로드 필요
      //현재 로컬에 다운되어있는 pdf를 찾는중
      const markdownFileName = `${pdfFileName.replace(".pdf", "")}.md`;
      const markdownFilePath = path.join(mdFolderPath, markdownFileName);

      tempPdfPath = await this.downloadPdf(downloadUrl);
      const pdfBuffer = fs.readFileSync(tempPdfPath);
      const base64Pdf = pdfBuffer.toString("base64");

      const filePart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf,
        },
      };

      const prompt = `\n첨부된 PDF는 금융 보고서입니다.\n\n이 문서의 내용을 가능한 한 정확하고 자세하게 쓰되 요약하여 정리하십시오.\n보고서의 흐름과 세부 내용을 충실히 반영해 작성하십시오.\n작성자의 해석이나 주관적 판단 없이, PDF에 포함된 내용을 기반으로 정리하십시오.\n형식은 마크다운을 계층형식으로 작성하십시오.\n\n그래프 같은 것 들이 있는 경우 각 그래프 마다 간단하게 지표를뽑아내거나 평가한정보가 있어야 함\n제목이나 항목 구분 하며 본문 내용을 작성하십시오.\n\n문서 외적인 설명, 요약, 해설, 주석은 포함하지 마십시오.\n보고서 제목, 작성자, 날짜와 같은 부가 정보는 모두 제외하십시오.\n\n결과는 아래 예시와 같이 **굵은 글씨**와 -을 활용한 리스트 형식으로 깔끔하게 정리하여야 함.\n\n## 전세계 주식시장의 이익동향\n\n    **전세계 12개월 선행 EPS** : 전월 대비 -0.1% 하락\n\n    - 신흥국: -0.6%\n\n    - 선진국: -0.01%\n\n    - 국가별 변화\n\n    - 상향 조정: 미국(+0.4%), 홍콩(+0.2%)\n\n    - 하향 조정: 브라질(-2.0%), 일본(-1.2%), 중국(-0.9%)\n            \n`;
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([prompt, filePart]);
      const response = result.response;
      const markdownContent = response.text();

      // 마크다운 파일 저장
      fs.writeFileSync(markdownFilePath, markdownContent, "utf8");
      console.log(`마크다운 파일 저장 완료: ${markdownFilePath}`);

      return {
        markdown: markdownContent,
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
    const outputPath = path.join(this.tempDir, filename);

    try {
      console.log(`PDF 다운로드 중: ${url}`);

      // httpService 사용
      const response = await this.httpService.axiosRef.get(url, {
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

      // 성공한 변환 결과들로 mdFileName 업데이트
      const successfulConversions = conversionResults.filter((r) => r.success);

      for (const conversion of successfulConversions) {
        const reportId = conversion.fileName.replace(".md", "");

        // reports 배열에서 해당 ID 찾아서 mdFileName 업데이트
        const reportIndex = reportsData.reports.findIndex(
          (report) => report.id === reportId,
        );

        if (reportIndex !== -1) {
          reportsData.reports[reportIndex].mdFileName = conversion.fileName;
        }
      }

      // 마크다운 변환 완료 시간 업데이트
      reportsData.lastMarkdownUpdate = new Date().toISOString();

      // JSON 파일 다시 저장
      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(reportsData, null, 2),
        "utf8",
      );
      console.log(`JSON 파일 업데이트 완료: ${successfulConversions.length}개`,);
    } catch (error) {
      console.error(`JSON 파일 갱신 실패:`, error);
    }
  }


  private readonly industryTags = [
    "반도체", "IT하드웨어", "IT소프트웨어", "인터넷/게임", "통신서비스",
    "자동차", "내구소비재/의류", "유통/소매", "미디어/엔터테인먼트", "호텔/레저",
    "필수소비재", "음식료", "기계", "조선", "운송", "건설", "상사/자본재",
    "제약/바이오", "헬스케어", "은행", "증권", "보험", "화학", "정유",
    "철강/금속", "에너지", "유틸리티"
  ];

  /*
   * 산업 분석 보고서를 기반으로 산업군별 평가.
   */
  public async evaluateLatestIndustries(limit: number = 5): Promise<any> {
    console.log(`산업군 평가 시작: 보고서 ${limit} 개`);

    // 1. 최신 데이터 수집
    const { limitedFiles, fileContents } = await this.getLatestMarkdownFiles(
      "./downloads/reports_IA.json",
      limit,
      { contentLengthLimit: 10000, shouldLimitLength: true }
    );

    if (fileContents.length === 0) {
      console.log("평가할 보고서가 없습니다.");
      return null;
    }

    try {
      //보고서별 산업군 분류
      const classifiedReports = await this._classifyIndustries(limitedFiles);
      if (!classifiedReports) {
        throw new Error("산업군 분류에 실패했습니다.");
      }

      //분류 결과 기반 데이터 재구성
      const reportsByIndustry = this._groupReportsByIndustry(classifiedReports, limitedFiles, fileContents);

      //산업군별 전망 평가
      const industryEvaluations = [];
      for (const [industryName, reports] of reportsByIndustry.entries()) {
        console.log(`\n${industryName} 산업 평가 중... (${reports.reportContents.length}개 보고서)`);
        const evaluationResult = await this._evaluateIndustryContents(industryName, reports.reportContents);
        if (evaluationResult) {
          industryEvaluations.push({
            industryName,
            ...evaluationResult,
            referencedReports: reports.referencedReports,
          });
        }
      }

      //최종 결과 조합 및 파일 저장
      const finalResult = {
        lastEvaluated: new Date().toISOString(),
        evaluatedReportCount: limitedFiles.length,
        industryEvaluations,
      };

      const outputPath = "./downloads/summary/industry_evaluation.json";
      if (!fs.existsSync("./downloads/summary")) {
        fs.mkdirSync("./downloads/summary", { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(finalResult, null, 2), "utf8");
      console.log(`\n평가 완료, 최종 결과가 ${outputPath}에 저장.`);

      return finalResult;

    } catch (error) {
      console.error("산업군 평가 실패:", error);
      return null;
    }
  }

  /*
   * LLM을 호출하여 보고서를 산업군 태그로 분류.
   */
  private async _classifyIndustries(reports: MiraeAssetReport[]): Promise<Array<{ id: string; industries: string[] }>> {
    console.log("LLM 호출: 산업군 분류 중...");
    const reportsToClassify = reports.map(r => ({ id: r.id, title: r.title, content: this.readLatestMarkdownFiles([r], { contentLengthLimit: 200, shouldLimitLength: true })[0]?.content || '' }));

    const prompt = `
    다음은 미리 정의된 산업군 태그 목록입니다:
    [${this.industryTags.join(", ")}]
       
    이제 아래 보고서들의 제목과 내용 일부를 보고, 각 보고서가 이 목록에 있는 태그 중 어떤 산업군(들)에 가장 적합한지 분류해 주십시오.
    하나의 보고서는 여러 산업군에 속할 수 있습니다. 목록에 없는 산업군은 절대로 만들지 마십시오.
    결과는 반드시 다음 JSON 형식으로 반환해 주십시오: 
    [{ "id": "보고서ID", "industries": ["선택된태그1", "선택된태그2"] }, ...]
          
    --- 보고서 목록 ---
    ${JSON.stringify(reportsToClassify, null, 2)}
    `;

    return this._callGenerativeModel(prompt);
  }

  /*
   * 분류된 산업군에 따라 보고서 내용을 그룹화.
   */
  private _groupReportsByIndustry(classifiedReports: Array<{ id: string; industries: string[] }>, allReports: MiraeAssetReport[], allContents: Array<{ fileName: string; content: string }>) {
    const reportsByIndustry = new Map<string, { reportContents: string[], referencedReports: any[] }>();

    for (const classified of classifiedReports) {
      const originalReport = allReports.find(r => r.id === classified.id);
      if (!originalReport || !originalReport.mdFileName) continue;

      const reportContent = allContents.find(c => c.fileName === originalReport.mdFileName)?.content;
      if (!reportContent) continue;

      for (const industryName of classified.industries) {
        if (!reportsByIndustry.has(industryName)) {
          reportsByIndustry.set(industryName, { reportContents: [], referencedReports: [] });
        }
        const industryData = reportsByIndustry.get(industryName)!;
        industryData.reportContents.push(reportContent);
        industryData.referencedReports.push({ id: originalReport.id, title: originalReport.title });
      }
    }
    return reportsByIndustry;
  }

  /*
   * LLM을 호출하여 특정 산업군에 대한 평가
   */
  private async _evaluateIndustryContents(industryName: string, contents: string[]): Promise<any> {
    const prompt = `
    너는 전문 애널리스트다. 다음은 '${industryName}' 산업에 대한 최신 증권사 보고서 내용들이다.
    --- 보고서 내용 ---
    ${contents.join("\n\n---\n\n")}
    --- 내용 끝 ---
    
    위 자료들을 근거로 '${industryName}' 산업의 동향이 국내 주식 시장의'${industryName}' 관련주들에 미칠 영향을 평가하되, 
    특히 해외 경쟁사의 성장이 국내 기업의 시장 점유율과 수익성에 미칠 위협을 중점적으로 분석하여라.
    핵심 긍정 요인, 핵심 리스크 또한 국내 시장의 시점으로 작성하여라.
    반드시 다음 JSON 스키마에 맞춰서 결과를 반환해라:
      {
        "evaluation": "긍정적|부정적|중립적",
        "evaluationCode": "POSITIVE|NEGATIVE|NEUTRAL",
        "confidence": 0.0,
        "summary": "종합 평가 요약 (2-3 문장)",
        "keyDrivers": ["핵심 긍정 요인1", "요인2"],
        "keyRisks": ["핵심 리스크1", "리스크2"]
      }
                                                                    `;
    return this._callGenerativeModel(prompt);
  }

  /*
   * gemini 호출하고 JSON 응답을 파싱합니다.
   */
  private async _callGenerativeModel(prompt: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("LLM 호출 또는 JSON 파싱 실패:", error, "Original Text:", (error as any).responseText || '');
      return null;
    }
  }
}