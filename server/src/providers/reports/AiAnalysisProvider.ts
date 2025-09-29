import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import { MiraeAssetReport } from "@models/Reports";
import { ReportBaseProvider } from "./ReportBaseProvider";
import { ReportFileManager } from "./ReportFileManager";

@Injectable()
export class AiAnalysisProvider {
  constructor(
    private readonly baseProvider: ReportBaseProvider,
    private readonly fileManager: ReportFileManager,
  ) {}

  private readonly industryTags = [
    "반도체", "IT하드웨어", "IT소프트웨어", "인터넷", "게임", "통신서비스",
    "자동차", "내구소비재/의류", "유통/소매", "미디어/엔터테인먼트", "호텔/레저",
    "필수소비재", "음식료", "기계", "조선", "운송", "건설", "상사/자본재",
    "제약/바이오", "헬스케어", "은행", "증권", "보험", "화학", "정유",
    "철강/금속", "에너지", "유틸리티"
  ];

  /**
   * 산업 분석 보고서를 기반으로 산업군별 평가하는 함수
   */
  public async evaluateLatestIndustries(limit: number = 5): Promise<any> {
    console.log(`산업군 평가 시작: 보고서 ${limit} 개`);

    // 1. 최신 데이터 수집
    const { limitedFiles, fileContents } = this.fileManager.getLatestMarkdownFiles(
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
      const classifiedReports = await this.classifyIndustries(limitedFiles);
      if (!classifiedReports) {
        throw new Error("산업군 분류에 실패했습니다.");
      }

      //분류 결과 기반 데이터 재구성
      const reportsByIndustry = this.groupReportsByIndustry(classifiedReports, limitedFiles, fileContents);

      //산업군별 전망 평가
      const industryEvaluations = [];
      for (const [industryName, reports] of reportsByIndustry.entries()) {
        console.log(`\n${industryName} 산업 1차 평가 중... (${reports.reportContents.length}개 보고서)`);
        const evaluationResult = await this.evaluateIndustryContents(industryName, reports.reportContents);
        
        if (evaluationResult) {
          // 2차 신뢰도 평가
          const confidence = await this.rateConfidence(evaluationResult, reports.reportContents);
          evaluationResult.confidence = confidence;

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

  /**
   * 1차 평가 결과와 원본 보고서 내용을 바탕으로 신뢰도 점수를 평가합니다.
   * @param initialEvaluation 1차 평가 결과
   * @param reportContents 원본 보고서 내용
   * @returns 0.0에서 1.0 사이의 신뢰도 점수
   */
  private async rateConfidence(
    initialEvaluation: any,
    reportContents: string[],
  ): Promise<number> {
    console.log(`  - 신뢰도 평가 중...`);
    const prompt = `
      다음은 여러 증권사 원본 보고서에서 발췌한 내용과, 그것을 AI가 1차 분석한 결과입니다.

      --- 원본 보고서 내용 요약 ---
      ${reportContents.map(c => c.substring(0, 1000)).join("\n\n---\n\n")}
      --- 내용 끝 ---

      --- 1차 분석 결과 ---
      - 평가: ${initialEvaluation.evaluation}
      - 요약: ${initialEvaluation.summary}
      - 긍정 요인: ${initialEvaluation.keyDrivers.join(", ")}
      - 리스크 요인: ${initialEvaluation.keyRisks.join(", ")}
      --- 결과 끝 ---

      원본 보고서 내용을 근거로 판단했을 때, 1차 분석 결과가 얼마나 정확하고 논리적인지 0.0에서 1.0 사이의 신뢰도 점수로 평가해주세요.
      - 1.0에 가까울수록 원본 내용에 매우 충실하고 정확한 분석입니다.
      - 0.0에 가까울수록 원본 내용과 동떨어지거나 논리적 오류가 있는 분석입니다.

      숫자만 포함된 JSON 형식으로 다음과 같이 응답해주세요:
      { "confidence": 0.85 }
    `;

    try {
      const result = await this.callGenerativeModel(prompt);
      const confidence = result?.confidence;
      if (typeof confidence === 'number' && confidence >= 0 && confidence <= 1) {
        console.log(`  - 신뢰도 점수: ${confidence}`);
        return confidence;
      }
      console.warn("  - 신뢰도 점수 파싱 실패, 기본값 0.5 사용");
      return 0.5;
    } catch (error) {
      console.error("  - 신뢰도 평가 중 오류 발생, 기본값 0.5 사용", error);
      return 0.5;
    }
  }

  /**
   * LLM을 호출하여 보고서를 산업군 태그로 분류.
   */
  private async classifyIndustries(reports: MiraeAssetReport[]): Promise<Array<{ id: string; industries: string[] }>> {
    console.log("LLM 호출: 산업군 분류 중...");
    const reportsToClassify = reports.map(r => (
      { id: r.id, title: r.title, content: this.fileManager.readLatestMarkdownFiles([r], { contentLengthLimit: 200, shouldLimitLength: true })[0]?.content || '' }
    ));

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

    return this.callGenerativeModel(prompt);
  }

  /**
   * 분류된 산업군에 따라 보고서 내용을 그룹화.
   */
  private groupReportsByIndustry(classifiedReports: Array<{ id: string; industries: string[] }>, allReports: MiraeAssetReport[], allContents: Array<{ fileName: string; content: string }>) {
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

  /**
   * LLM을 호출하여 특정 산업군에 대한 평가
   */
  private async evaluateIndustryContents(industryName: string, contents: string[]): Promise<any> {
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
        "confidence": 0, (무조건 0으로 고정)
        "summary": "종합 평가 요약 (2-3 문장)",
        "keyDrivers": ["핵심 긍정 요인1", "요인2"],
        "keyRisks": ["핵심 리스크1", "리스크2"]
      }
                                                                    `;
    return this.callGenerativeModel(prompt);
  }

  /**
   * gemini 호출하고 JSON 응답을 파싱합니다.
   */
  private async callGenerativeModel(prompt: string): Promise<any> {
    try {
      return await this.baseProvider.callGenerativeModelAndParseJson(prompt);
    } catch (error) {
      console.error("LLM 호출 또는 JSON 파싱 실패:", error);
      return null;
    }
  }
}


