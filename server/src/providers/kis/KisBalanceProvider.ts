import { IKisSessionData, IKisPortfolio } from "@models/KisTrading";
import { Injectable, Logger } from "@nestjs/common";

import { KisConstants } from "./KisConstants";

@Injectable()
export class KisBalanceProvider {
  private readonly logger = new Logger(KisBalanceProvider.name);

  /**
   * 포트폴리오 요약 정보 조회 (PortfolioHeader용 간소화된 데이터)
   */
  async getPortfolioSummary(
    sessionData: IKisSessionData,
  ): Promise<IKisPortfolio.IPortfolioSummary> {
    try {
      // 전체 포트폴리오 데이터 가져오기
      const portfolioData = await this.getPortfolioData(sessionData);

      // 간소화된 요약 정보로 변환
      return this.formatPortfolioSummary(portfolioData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Portfolio summary inquiry failed: ${errorMessage}`);
      throw new Error(`포트폴리오 요약 조회 실패: ${errorMessage}`);
    }
  }

  /**
   * 전체 포트폴리오 데이터 조회
   */
  async getPortfolioData(
    sessionData: IKisSessionData,
  ): Promise<IKisPortfolio.IPortfolioResponse> {
    try {
      // 잔고 데이터 가져오기 (sessionData에 이미 토큰 포함)
      const balanceData = await this.fetchBalance(sessionData);

      // 전체 데이터 포맷팅해서 리턴
      return this.formatPortfolioData(balanceData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Portfolio data inquiry failed: ${errorMessage}`);
      throw new Error(`포트폴리오 조회 실패: ${errorMessage}`);
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
   * 전체 포트폴리오 데이터 포맷팅 (모든 필드 포함)
   */
  private formatPortfolioData(data: any): IKisPortfolio.IPortfolioResponse {
    if (!data.output1) {
      return {
        rt_cd: data.rt_cd || "0",
        msg_cd: data.msg_cd || "",
        msg1: data.msg1 || "",
        ctx_area_fk100: data.ctx_area_fk100 || "",
        ctx_area_nk100: data.ctx_area_nk100 || "",
        output1: [],
        output2: data.output2 || [],
        message: "보유 주식이 없어요",
      };
    }

    // 보유수량이 0보다 큰 종목만 필터링
    const holdings = data.output1
      .filter((item: any) => parseInt(item.hldg_qty) > 0)
      .map((item: any): IKisPortfolio.IStockHolding => ({
        pdno: item.pdno || "",
        prdt_name: item.prdt_name || "",
        trad_dvsn_name: item.trad_dvsn_name || "",
        bfdy_buy_qty: item.bfdy_buy_qty || "0",
        bfdy_sll_qty: item.bfdy_sll_qty || "0",
        thdt_buyqty: item.thdt_buyqty || "0",
        thdt_sll_qty: item.thdt_sll_qty || "0",
        hldg_qty: item.hldg_qty || "0",
        ord_psbl_qty: item.ord_psbl_qty || "0",
        pchs_avg_pric: item.pchs_avg_pric || "0",
        pchs_amt: item.pchs_amt || "0",
        prpr: item.prpr || "0",
        evlu_amt: item.evlu_amt || "0",
        evlu_pfls_amt: item.evlu_pfls_amt || "0",
        evlu_pfls_rt: item.evlu_pfls_rt || "0",
        fltt_rt: item.fltt_rt || "0",
        bfdy_cprs_icdc: item.bfdy_cprs_icdc || "0",
      }));

    const accountSummary: IKisPortfolio.IAccountSummary[] = (data.output2 || []).map((item: any): IKisPortfolio.IAccountSummary => ({
      dnca_tot_amt: item.dnca_tot_amt || "0",
      nxdy_excc_amt: item.nxdy_excc_amt || "0",
      prvs_rcdl_excc_amt: item.prvs_rcdl_excc_amt || "0",
      cma_evlu_amt: item.cma_evlu_amt || "0",
      bfdy_buy_amt: item.bfdy_buy_amt || "0",
      thdt_buy_amt: item.thdt_buy_amt || "0",
      nxdy_auto_rdpt_amt: item.nxdy_auto_rdpt_amt || "0",
      bfdy_sll_amt: item.bfdy_sll_amt || "0",
      thdt_sll_amt: item.thdt_sll_amt || "0",
      d2_auto_rdpt_amt: item.d2_auto_rdpt_amt || "0",
      bfdy_tlex_amt: item.bfdy_tlex_amt || "0",
      thdt_tlex_amt: item.thdt_tlex_amt || "0",
      tot_loan_amt: item.tot_loan_amt || "0",
      scts_evlu_amt: item.scts_evlu_amt || "0",
      tot_evlu_amt: item.tot_evlu_amt || "0",
      nass_amt: item.nass_amt || "0",
      fncg_gld_auto_rdpt_yn: item.fncg_gld_auto_rdpt_yn || "N",
      pchs_amt_smtl_amt: item.pchs_amt_smtl_amt || "0",
      evlu_amt_smtl_amt: item.evlu_amt_smtl_amt || "0",
      evlu_pfls_smtl_amt: item.evlu_pfls_smtl_amt || "0",
      tot_stln_slng_chgs: item.tot_stln_slng_chgs || "0",
      bfdy_tot_asst_evlu_amt: item.bfdy_tot_asst_evlu_amt || "0",
      asst_icdc_amt: item.asst_icdc_amt || "0",
      asst_icdc_erng_rt: item.asst_icdc_erng_rt || "0",
    }));

    return {
      rt_cd: data.rt_cd || "0",
      msg_cd: data.msg_cd || "",
      msg1: data.msg1 || "",
      ctx_area_fk100: data.ctx_area_fk100 || "",
      ctx_area_nk100: data.ctx_area_nk100 || "",
      output1: holdings,
      output2: accountSummary,
      message: `${holdings.length}개 종목을 보유중이에요`,
    };
  }

  /**
   * 포트폴리오 요약 정보 포맷팅 (PortfolioHeader에 필요한 핵심 데이터만)
   */
  private formatPortfolioSummary(portfolioData: IKisPortfolio.IPortfolioResponse): IKisPortfolio.IPortfolioSummary {
    const accountSummary = portfolioData.output2[0];
    const stockCount = portfolioData.output1.length;

    // 한투 API 필드에서 필요한 값들 추출 및 숫자 변환
    const totalValue = parseInt(accountSummary?.tot_evlu_amt || "0");
    const changeAmount = parseInt(accountSummary?.evlu_pfls_smtl_amt || "0");
    const totalInvestment = parseInt(accountSummary?.pchs_amt_smtl_amt || "0");

    // 평가손익율 계산 (투자원금대비)
    let changePercent = 0;
    if (totalInvestment > 0) {
      changePercent = (changeAmount / totalInvestment) * 100;
    }

    return {
      totalValue,
      changeAmount,
      changePercent: Math.round(changePercent * 100) / 100, // 소수점 2자리
      totalInvestment,
      stockCount,
      message: portfolioData.message
    };
  }
}
