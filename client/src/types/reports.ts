export interface ReferencedReport {
  id: string;
  title: string;
}

export interface IndustryEvaluation {
  industryName: string;
  evaluation: string;
  evaluationCode: string;
  confidence: number;
  summary: string;
  keyDrivers: string[];
  keyRisks: string[];
  referencedReports: ReferencedReport[];
}

export interface IndustryEvaluationSummaryResponse {
  lastEvaluated: string;
  evaluatedReportCount: number;
  industryEvaluations: IndustryEvaluation[];
}