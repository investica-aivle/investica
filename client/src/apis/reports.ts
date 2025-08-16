import axios from 'axios';
import { KeywordSummaryResult, ReportDetail } from '../models/Reports';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const reportsApi = {
  /**
   * 특정 제목의 보고서 상세 정보 조회
   */
  getReportByTitle: (title: string): Promise<ReportDetail> => {
    return axios.get(`${API_BASE_URL}/reports/${encodeURIComponent(title)}`)
      .then(response => response.data);
  },

  /**
   * 키워드 요약 결과 조회
   */
  getKeywordSummary: (): Promise<KeywordSummaryResult> => {
    return axios.get(`${API_BASE_URL}/reports/summary/keyword`)
      .then(response => response.data);
  }
};

export default reportsApi;
