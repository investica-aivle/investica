import { Injectable } from "@nestjs/common";
import { ReportBaseProvider } from "./ReportBaseProvider";
import { ReportFileManager } from "./ReportFileManager";
import { ReportCacheManager } from "./ReportCacheManager";
import { Keyword, KeywordSummaryResult } from "@models/Reports";

@Injectable()
export class ReportKeywordExtractor {
  constructor(
    private readonly baseProvider: ReportBaseProvider,
    private readonly fileManager: ReportFileManager,
    private readonly cacheManager: ReportCacheManager,
  ) {}

  /**
   * 키워드 기반 짧은 요약 생성
   */
  public async generateKeywordSummary(
    jsonFilePath: string = "./downloads/reports.json",
    limit: number = 5,
  ): Promise<KeywordSummaryResult> {
    try {
      console.log("generateKeywordSummary");

      const { limitedFiles, fileContents } = this.fileManager.getLatestMarkdownFiles(
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
      const cacheResult = this.cacheManager.checkKeywordCache(limitedFiles);
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
      await this.cacheManager.saveKeywordCache(keywordData, limitedFiles);

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
   * AI 키워드 요약 요청
   */
  private async requestAIKeywordSummary(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ): Promise<Keyword[]> {
    const keywordPrompt = this.createKeywordPrompt(fileContents);
    const response = await this.baseProvider.callGenerativeModelAndParseJson(keywordPrompt);
    return this.validateKeywordArray(response);
  }

  /**
   * 키워드 요약 프롬프트 생성
   */
  private createKeywordPrompt(
    fileContents: Array<{
      fileName: string;
      content: string;
    }>,
  ): string {
    const formatInstructions = this.getKeywordFormatInstructions();

    return `다음 ${fileContents.length}개의 최신 증권보고서들에서 주식시장에 영향을 줄 핵심 키워드를 추출해줘:\n\n${fileContents
  .map(
    (file, index) => `\n**${index + 1}. ${file.fileName}**\n${file.content.substring(0, 500)}...\n`,
  )
  .join("\n")}\n\n위 보고서들에서 주식시장에 직접적인 영향을 줄 수 있는 핵심 키워드 3-8개를 추출해주세요.\n\n${formatInstructions}\n\n각 키워드는 구체적이고 임팩트 있는 것들로 추출해주세요.`;
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
   * 키워드 스키마의 format_instructions 생성 (Pydantic parser와 유사)
   */
  private getKeywordFormatInstructions(): string {
    return `The output should be formatted as a JSON array that conforms to the following schema:\n\n'''json\n{\n  "type": "array",\n  "items": {\n    "type": "object", \n    "properties": {\n      "icon": { "type": "string", "description": "적절한 이모지 아이콘" },\n      "keyword": { "type": "string", "description": "주식시장에 영향을 주는 핵심 키워드" },\n      "description": { "type": "string", "description": "키워드에 대한 한두 줄 설명" },\n      "impact": { \n        "type": "string", \n        "enum": ["positive", "negative", "neutral"],\n        "description": "키워드가 주식시장에 미치는 영향"\n      }\n    },\n    "required": ["icon", "keyword", "description", "impact"]\n  }\n}\n'''\n\nExample output:\n'''json\n[\n  {\n    "icon": "🚨",\n    "keyword": "트럼프 관세 35% 선언",\n    "description": "미국 대선 후보 트럼프가 중국산 수입품에 35% 관세 부과를 선언하여 무역 긴장 고조",\n    "impact": "negative"\n  },\n  {\n    "icon": "📈",\n    "keyword": "반도체 수요 급증", \n    "description": "AI 서버 수요 증가로 인한 메모리 반도체 가격 상승 전망",\n    "impact": "positive"\n  }\n]\n'''`;
  }
}