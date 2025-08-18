import { IKisSessionData } from "@models/KisTrading";
import { Injectable, Logger } from "@nestjs/common";

import { KisConstants } from "./KisConstants";

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

@Injectable()
export class KisBalanceProvider {
  private readonly logger = new Logger(KisBalanceProvider.name);

  /**
   * 잔고 조회하기
   */
  async getStockBalance(
    sessionData: IKisSessionData,
  ): Promise<IStockBalanceResponse> {
    try {
      // 잔고 데이터 가져오기 (sessionData에 이미 토큰 포함)
      const balanceData = await this.fetchBalance(sessionData);

      // 간단하게 정리해서 리턴
      return this.formatBalance(balanceData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Stock balance inquiry failed: ${errorMessage}`);
      throw new Error(`잔고 조회 실패: ${errorMessage}`);
    }
  }

  /**
   * 잔고 데이터 가져오기
   */
  private async fetchBalance(sessionData: IKisSessionData): Promise<any> {
    const balanceUrl = `${KisConstants.VIRTUAL_DOMAIN}${KisConstants.ENDPOINTS.BALANCE}`;

    // 계좌번호 파싱 (예: "5014853-01" -> CANO: "50148530", ACNT_PRDT_CD: "01")
    const accountParts = sessionData.accountNumber.split("-");
    const CANO = accountParts[0];
    const ACNT_PRDT_CD =
      accountParts[1] || KisConstants.BALANCE_PARAMS.ACNT_PRDT_CD;

    const headers = {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${sessionData.accessToken}`,
      appkey: sessionData.appKey,
      appsecret: sessionData.appSecret,
      tr_id: KisConstants.TR_ID.BALANCE.VIRTUAL,
      custtype: KisConstants.CUST_TYPE.PERSONAL,
    };

    const params = new URLSearchParams({
      CANO: CANO,
      ACNT_PRDT_CD: ACNT_PRDT_CD,
      AFHR_FLPR_YN: KisConstants.BALANCE_PARAMS.AFHR_FLPR_YN,
      OFL_YN: KisConstants.BALANCE_PARAMS.OFL_YN,
      INQR_DVSN: KisConstants.BALANCE_PARAMS.INQR_DVSN.BY_STOCK,
      UNPR_DVSN: KisConstants.BALANCE_PARAMS.UNPR_DVSN,
      FUND_STTL_ICLD_YN: KisConstants.BALANCE_PARAMS.FUND_STTL_ICLD_YN,
      FNCG_AMT_AUTO_RDPT_YN: KisConstants.BALANCE_PARAMS.FNCG_AMT_AUTO_RDPT_YN,
      PRCS_DVSN: KisConstants.BALANCE_PARAMS.PRCS_DVSN.EXCLUDE_PREV_DAY,
      CTX_AREA_FK100: KisConstants.BALANCE_PARAMS.CTX_AREA_FK100,
      CTX_AREA_NK100: KisConstants.BALANCE_PARAMS.CTX_AREA_NK100,
    });

    const response = await fetch(`${balanceUrl}?${params}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Balance request failed: ${response.status} ${response.statusText}`,
        {
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText,
          account: sessionData.accountNumber.replace(
            /(\d{4})\d+(\d{2})/,
            "$1****$2",
          ),
        },
      );
      throw new Error(
        `Balance request failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * AI가 이해할 수 있게 정리
   */
  private formatBalance(data: any): IStockBalanceResponse {
    if (!data.output1) {
      return {
        message: "보유 주식이 없어요",
        stocks: [],
      };
    }

    const stocks = data.output1
      .filter((item: any) => parseInt(item.hldg_qty) > 0)
      .map((item: any) => ({
        name: item.prdt_name,
        quantity: item.hldg_qty,
        buyPrice: item.pchs_avg_pric,
        currentPrice: item.prpr,
        profit: item.evlu_pfls_rt,
      }));

    return {
      message: `${stocks.length}개 종목을 보유중이에요`,
      stocks: stocks,
    };
  }
}
