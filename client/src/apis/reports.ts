import { KeywordSummaryResult, ReportDetail } from '../models/Reports';
import apiClient from './index';

const reportsApi = {
  /**
   * 특정 제목의 보고서 상세 정보 조회
   */
  getReportByTitle: (title: string): Promise<ReportDetail> => {
    return apiClient.get(`/reports/${encodeURIComponent(title)}`)
      .then(response => response.data);
  },

  /**
   * 키워드 요약 결과 조회
   */
  getKeywordSummary: (): Promise<KeywordSummaryResult> => {
    return apiClient.get('/reports/summary/keyword')
      .then(response => response.data);
  }
};

export default reportsApi;
