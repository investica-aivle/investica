import { IKisSessionData, IKisStock } from "@models/KisTrading";
import { Injectable, Logger } from "@nestjs/common";

import { KisAuthProvider } from "./KisAuthProvider";
import { KisConstants } from "./KisConstants";
import { MaskingUtil } from "../../utils/MaskingUtil";

// KIS API 주문 요청 바디 (내부용)
interface IKisOrderRequestBody {
  CANO: string; // 종합계좌번호 (8자리)
  ACNT_PRDT_CD: string; // 계좌상품코드 (2자리)
  PDNO: string; // 상품번호 (종목코드 6자리)
  SLL_TYPE?: string; // 매도유형 (매도주문 시)
  ORD_DVSN: string; // 주문구분 (00:지정가, 01:시장가)
  ORD_QTY: string; // 주문수량
  ORD_UNPR: string; // 주문단가
  CNDT_PRIC?: string; // 조건가격
  EXCG_ID_DVSN_CD?: string; // 거래소ID구분코드
}

// KIS API 주문 응답 output (내부용)
interface IKisOrderOutput {
  KRX_FWDG_ORD_ORGNO: string; // 거래소코드
  ODNO: string; // 주문번호
  ORD_TMD: string; // 주문시간
}

// KIS API 주문 응답 (내부용)
interface IKisOrderApiResponse {
  rt_cd: string; // 성공실패여부 (0:성공)
  msg_cd: string; // 응답코드
  msg1: string; // 응답메시지
  output?: IKisOrderOutput[]; // 응답상세
}

@Injectable()
export class KisTradingProvider {
  private readonly logger = new Logger(KisTradingProvider.name);

  constructor(private readonly kisAuthProvider: KisAuthProvider) {}

  /**
   * 주식 주문 실행
   */
  public async executeStockOrder(
    sessionData: IKisSessionData,
    orderRequest: IKisStock.IOrderRequest,
  ): Promise<IKisStock.IOrderResponse> {
    // TR_ID 결정 (매수/매도에 따라)
    const trId =
      orderRequest.orderType === "buy"
        ? KisConstants.TR_ID.STOCK_ORDER.VIRTUAL.BUY
        : KisConstants.TR_ID.STOCK_ORDER.VIRTUAL.SELL;

    // 로그에서 마스킹된 정보 사용
    const maskedAccountNumber = MaskingUtil.maskAccountNumber(sessionData.accountNumber);

    this.logger.log(
      `Executing ${orderRequest.orderType} order for ${orderRequest.stockCode}, quantity: ${orderRequest.quantity}, account: ${maskedAccountNumber}`,
    );

    try {
      // 토큰 만료 체크 및 갱신
      const validSessionData =
        await this.kisAuthProvider.refreshTokenIfNeeded(sessionData);

      // 계좌번호 분리 (KisAuthProvider 활용)
      const { CANO, ACNT_PRDT_CD } = this.kisAuthProvider.parseAccountNumber(
        validSessionData.accountNumber,
      );

      // 주문구분 설정 (00:지정가, 01:시장가)
      const orderDivision =
        orderRequest.orderCondition === "limit"
          ? KisConstants.ORDER_DIVISION.LIMIT
          : KisConstants.ORDER_DIVISION.MARKET;

      // 요청 바디 구성
      const requestBody: IKisOrderRequestBody = {
        CANO,
        ACNT_PRDT_CD,
        PDNO: orderRequest.stockCode,
        ORD_DVSN: orderDivision,
        ORD_QTY: orderRequest.quantity.toString(),
        ORD_UNPR: orderRequest.price ? orderRequest.price.toString() : "0",
      };

      // 매도 주문인 경우 매도유형 추가
      if (orderRequest.orderType === "sell") {
        requestBody.SLL_TYPE = KisConstants.SELL_TYPE.NORMAL;
      }

      // API 헤더 구성 (KisAuthProvider 활용)
      const headers = this.kisAuthProvider.createApiHeaders(
        validSessionData,
        trId,
      );

      this.logger.debug(`Sending stock order request to KIS API`, {
        trId,
        stockCode: orderRequest.stockCode,
        orderType: orderRequest.orderType,
        quantity: orderRequest.quantity,
        orderCondition: orderRequest.orderCondition,
        account: maskedAccountNumber,
      });

      // KIS API 호출
      const response = await fetch(
        `${KisConstants.VIRTUAL_DOMAIN}/uapi/domestic-stock/v1/trading/order-cash`,
        {
          method: "POST",
          headers: headers as any,
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        this.logger.error(
          `[KisTradingProvider] KIS stock order API failed`,
          JSON.stringify(
            {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              headers: Object.fromEntries(response.headers.entries()),
              responseBody: errorText,
              requestBody: JSON.stringify(requestBody),
              account: maskedAccountNumber,
              stockCode: orderRequest.stockCode,
              orderType: orderRequest.orderType,
              quantity: orderRequest.quantity,
              orderCondition: orderRequest.orderCondition,
            },
            null,
            2,
          ),
        );

        return {
          success: false,
          message: `주문 실패: ${response.status} ${response.statusText}`,
          errorCode: response.status.toString(),
        };
      }

      const apiResponse: IKisOrderApiResponse = await response.json();

      // 응답 결과 확인
      if (apiResponse.rt_cd === "0") {
        const outputData = apiResponse.output?.[0];
        const orderId =
          outputData?.ODNO || outputData?.KRX_FWDG_ORD_ORGNO || "UNKNOWN";

        this.logger.log(`Stock order successful`, {
          orderId,
          orderTime: outputData?.ORD_TMD,
          stockCode: orderRequest.stockCode,
          orderType: orderRequest.orderType,
          quantity: orderRequest.quantity,
          account: maskedAccountNumber,
        });

        return {
          success: true,
          orderId,
          message: `${orderRequest.orderType === "buy" ? "매수" : "매도"} 주문이 완료되었습니다.`,
        };
      } else {
        this.logger.error(
          `[KisTradingProvider] KIS stock order API returned error`,
          JSON.stringify(
            {
              rt_cd: apiResponse.rt_cd,
              msg_cd: apiResponse.msg_cd,
              msg1: apiResponse.msg1,
              requestBody: {
                CANO,
                ACNT_PRDT_CD,
                PDNO: orderRequest.stockCode,
                ORD_DVSN: orderDivision,
                ORD_QTY: orderRequest.quantity.toString(),
                ORD_UNPR: orderRequest.price
                  ? orderRequest.price.toString()
                  : "0",
                SLL_TYPE:
                  orderRequest.orderType === "sell"
                    ? KisConstants.SELL_TYPE.NORMAL
                    : undefined,
              },
              headers: {
                tr_id: trId,
                authorization: `Bearer ${validSessionData.accessToken.substring(0, 20)}...`,
                appkey: MaskingUtil.maskAppKey(validSessionData.appKey),
                appsecret: "[HIDDEN]",
              },
              fullResponse: apiResponse,
              account: maskedAccountNumber,
              originalAccountNumber: validSessionData.accountNumber,
              parsedAccount: { CANO, ACNT_PRDT_CD },
              stockCode: orderRequest.stockCode,
              orderType: orderRequest.orderType,
              quantity: orderRequest.quantity,
              orderCondition: orderRequest.orderCondition,
            },
            null,
            2,
          ),
        );

        return {
          success: false,
          message: apiResponse.msg1 || "주문 처리 실패",
          errorCode: apiResponse.msg_cd,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `[KisTradingProvider] Stock order execution error`,
        JSON.stringify(
          {
            error: errorMessage,
            stack: errorStack,
            errorType: error?.constructor?.name || "Unknown",
            stockCode: orderRequest.stockCode,
            orderType: orderRequest.orderType,
            quantity: orderRequest.quantity,
            orderCondition: orderRequest.orderCondition,
            account: maskedAccountNumber,
          },
          null,
          2,
        ),
      );

      return {
        success: false,
        message: `주문 처리 중 오류가 발생했습니다: ${errorMessage}`,
      };
    }
  }
}
