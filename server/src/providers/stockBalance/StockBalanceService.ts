import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class StockBalanceService {
  constructor(
    @Inject('AXIOS_CLIENT') private axios: any,
    @Inject('KIS_CONFIG') private config: any,
    @Inject('KIS_CREDENTIALS') private credentials: any
  ) {}

  // 잔고 조회하기
  async getStockBalance() {
    try {
      // 1. 토큰 받기
      const token = await this.getToken();

      // 2. 잔고 데이터 가져오기
      const balanceData = await this.fetchBalance(token);

      // 3. 간단하게 정리해서 리턴
      return this.formatBalance(balanceData);

    } catch (error) {
      throw new Error(`잔고 조회 실패: ${error.message}`);
    }
  }

  // 토큰 받기
  private async getToken() {
    const tokenUrl = `${this.config.domain}${this.config.endpoints.token}`;

    const response = await this.axios.post(tokenUrl, {
      grant_type: 'client_credentials',
      appkey: this.credentials.appkey,
      appsecret: this.credentials.appsecret
    });

    return response.data.access_token;
  }

  // 잔고 데이터 가져오기
  private async fetchBalance(token: string) {
    const balanceUrl = `${this.config.domain}${this.config.endpoints.balance}`;

    const headers = {
      'authorization': `Bearer ${token}`,
      'appkey': this.credentials.appkey,
      'appsecret': this.credentials.appsecret,
      'tr_id': this.config.tr_id,
      'custtype': 'P'
    };

    const params = {
      CANO: this.credentials.account,
      ACNT_PRDT_CD: '01',
      INQR_DVSN: '02'
    };

    const response = await this.axios.get(balanceUrl, { headers, params });
    return response.data;
  }

  // AI가 이해할 수 있게 정리
  private formatBalance(data: any) {
    if (!data.output1) return { message: '보유 주식이 없어요', stocks: [] };

    const stocks = data.output1
      .filter((item: any) => parseInt(item.hldg_qty) > 0)
      .map((item: any) => ({
        name: item.prdt_name,
        quantity: item.hldg_qty,
        buyPrice: item.pchs_avg_pric,
        currentPrice: item.prpr,
        profit: item.evlu_pfls_rt
      }));

    return {
      message: `${stocks.length}개 종목을 보유중이에요`,
      stocks: stocks
    };
  }
}