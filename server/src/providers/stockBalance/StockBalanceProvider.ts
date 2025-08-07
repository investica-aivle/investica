import { Injectable, Logger } from '@nestjs/common';

export interface IStockBalanceItem {
  name: string;
  quantity: string;
  buyPrice: string;
  currentPrice: string;
  profit: string;
}

export interface IStockBalanceResponse {
  message: string;
  stocks: IStockBalanceItem[];
}

export interface IKisBalanceConfig {
  domain: string;
  endpoints: {
    token: string;
    balance: string;
  };
  tr_id: string;
}

export interface IKisCredentials {
  appkey: string;
  appsecret: string;
  account: string;
}

@Injectable()
export class StockBalanceProvider {
  private readonly logger = new Logger(StockBalanceProvider.name);

  /**
   * 잔고 조회하기
   */
  async getStockBalance(config: IKisBalanceConfig, credentials: IKisCredentials): Promise<IStockBalanceResponse> {
    try {
      // 1. 토큰 받기
      const token = await this.getToken(config, credentials);

      // 2. 잔고 데이터 가져오기
      const balanceData = await this.fetchBalance(config, credentials, token);

      // 3. 간단하게 정리해서 리턴
      return this.formatBalance(balanceData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stock balance inquiry failed: ${errorMessage}`);
      throw new Error(`잔고 조회 실패: ${errorMessage}`);
    }
  }

  /**
   * 토큰 받기
   */
  private async getToken(config: IKisBalanceConfig, credentials: IKisCredentials): Promise<string> {
    const tokenUrl = `${config.domain}${config.endpoints.token}`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: credentials.appkey,
        appsecret: credentials.appsecret
      }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * 잔고 데이터 가져오기
   */
  private async fetchBalance(config: IKisBalanceConfig, credentials: IKisCredentials, token: string): Promise<any> {
    const balanceUrl = `${config.domain}${config.endpoints.balance}`;

    const headers = {
      'authorization': `Bearer ${token}`,
      'appkey': credentials.appkey,
      'appsecret': credentials.appsecret,
      'tr_id': config.tr_id,
      'custtype': 'P'
    };

    const params = new URLSearchParams({
      CANO: credentials.account,
      ACNT_PRDT_CD: '01',
      INQR_DVSN: '02'
    });

    const response = await fetch(`${balanceUrl}?${params}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Balance request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * AI가 이해할 수 있게 정리
   */
  private formatBalance(data: any): IStockBalanceResponse {
    if (!data.output1) {
      return {
        message: '보유 주식이 없어요',
        stocks: []
      };
    }

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
