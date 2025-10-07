import { KeywordSummaryResult, ReportDetail } from '../models/Reports';
import { IndustryEvaluationSummaryResponse } from '../types/reports'; // IndustryEvaluationSummaryResponse 추가
import apiClient from './index';

const reportsApi = {
  /**
   * 특정 제목의 보고서 상세 정보 조회
   */
  getReportByTitle: (title: string): Promise<ReportDetail> => {
    return apiClient.get(`/api/reports/${encodeURIComponent(title)}`)
      .then(response => response.data);
  },

  /**
   * 키워드 요약 결과 조회
   */
  getKeywordSummary: (): Promise<KeywordSummaryResult> => {
    return apiClient.get('/api/reports/summary/keyword')
      .then(response => response.data);
  },

  /**
   * 산업 평가 요약 (AI 종목 추천) 결과 조회
   */
  getIndustryEvaluationSummary: (): Promise<IndustryEvaluationSummaryResponse> => { // 타입 변경
    return apiClient.get('/api/reports/summary/industry-evaluation')
      .then(response => response.data);
  },

  updateIndustryEvaluation: () => {
    return apiClient.post('/api/reports/update-reports')
        .then(response => response.data);
  }
};

export default reportsApi;
