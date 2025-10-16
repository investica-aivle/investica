import { IKisSessionData, IKisStock, IKisPortfolio } from "@models/KisTrading";
import { Injectable } from "@nestjs/common";
import { tags } from "typia";
import { IClientEvents, TradingConfirmationRequest } from "../../types/agentica";
import { randomUUID } from "crypto";

import { KisBalanceProvider } from "./KisBalanceProvider";
import { KisPriceProvider } from "./KisPriceProvider";
import { KisTradingProvider } from "./KisTradingProvider";
import { StockCodeService } from "../stock/StockCodeService";

/**
 * KIS Trading Service (Stateless)
 *
 * Internal service for KIS stock trading operations.
 * Requires sessionData to be passed as parameter to each method.
 */
@Injectable()
export class KisService {
  constructor(
    private readonly tradingProvider: KisTradingProvider,
    private readonly priceProvider: KisPriceProvider,
    private readonly balanceProvider: KisBalanceProvider,
    private readonly stockCodeService: StockCodeService,
  ) {}

  /**
   * Convert stock name to stock code using StockCodeService
   * @param stockName Korean stock name
   * @returns Stock code or null if not found
   */
  private async convertStockNameToCode(stockName: string): Promise<{ success: true; stockCode: string } | { success: false, error: IKisStock.IOrderResponse }> {
    const searchResults = this.stockCodeService.searchStocks(stockName, 1);
    if (searchResults.length === 0) {
      return {
        success: false,
        error: {
          success: false,
          message: `Stock not found: ${stockName}`,
          errorCode: "STOCK_NOT_FOUND",
        }
      };
    }

    return {
      success: true,
      stockCode: searchResults[0].code
    };
  }

  /**
   * Request trading confirmation from client
   */
  private async requestTradingConfirmation(
    stockName: string,
    stockCode: string,
    orderType: 'buy' | 'sell',
    input: {
      quantity: number;
      orderCondition: "market" | "limit";
      price?: number;
    },
    listener?: IClientEvents
  ): Promise<boolean> {
    if (!listener || !listener.onTradingConfirmationRequest) {
      console.log('[KisService] No listener available for trading confirmation, proceeding without confirmation');
      return true;
    }

    try {
      // Get stock info for confirmation
      const searchResults = this.stockCodeService.searchStocks(stockName, 1);
      const stockInfo = searchResults.length > 0 ? searchResults[0] : {
        code: stockCode,
        name: stockName,
        market: 'KOSPI' as const
      };

      // Calculate estimated amount for market orders (approximate)
      let estimatedAmount: number | undefined;
      if (input.orderCondition === 'limit' && input.price) {
        estimatedAmount = input.price * input.quantity;
      }

      const confirmationRequest: TradingConfirmationRequest = {
        id: randomUUID(),
        type: orderType,
        stockInfo,
        quantity: input.quantity,
        orderCondition: input.orderCondition,
        price: input.price,
        estimatedAmount
      };

      console.log('[KisService] Sending trading confirmation request to client:', {
        id: confirmationRequest.id,
        type: orderType,
        stockName: stockName,
        stockCode: stockCode,
        quantity: input.quantity,
        orderCondition: input.orderCondition,
        price: input.price,
        estimatedAmount
      });

      const response = await listener.onTradingConfirmationRequest(confirmationRequest);

      console.log('[KisService] Received trading confirmation response from client:', {
        id: response.id,
        confirmed: response.confirmed,
        orderType: orderType,
        stockName: stockName
      });

      return response.confirmed;
    } catch (error) {
      console.error('[KisService] Failed to request trading confirmation:', error);
      // If confirmation fails, proceed for safety
      return true;
    }
  }

  /**
   * Execute stock buy order
   */
  public async buyStock(
    sessionData: IKisSessionData,
    input: {
      stockName: string;
      quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;
      orderCondition: "market" | "limit";
      price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
    },
    listener?: IClientEvents
  ): Promise<IKisStock.IOrderResponse> {
    // Validate limit order has price
    if (input.orderCondition === "limit" && !input.price) {
      return {
        success: false,
        message: "Price is required for limit orders",
        errorCode: "MISSING_PRICE",
      };
    }

    // Convert stock name to stock code
    const conversionResult = await this.convertStockNameToCode(input.stockName);
    if (!conversionResult.success) {
      return conversionResult.error;
    }

    // Notify client about stock focus
    await this.notifyStockFocus(input.stockName, conversionResult.stockCode, listener);

    // Request confirmation from client
    const confirmed = await this.requestTradingConfirmation(
      input.stockName,
      conversionResult.stockCode,
      'buy',
      input,
      listener
    );

    if (!confirmed) {
      return {
        success: false,
        message: "매수 주문이 사용자에 의해 취소되었습니다.",
        errorCode: "USER_CANCELLED",
      };
    }

    // Execute the buy order using provided session data
    return await this.tradingProvider.executeStockOrder(sessionData, {
      stockCode: conversionResult.stockCode,
      orderType: "buy",
      quantity: input.quantity,
      price: input.price,
      orderCondition: input.orderCondition,
    });
  }

  /**
   * Execute stock sell order
   */
  public async sellStock(
    sessionData: IKisSessionData,
    input: {
      stockName: string;
      quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;
      orderCondition: "market" | "limit";
      price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
    },
    listener?: IClientEvents
  ): Promise<IKisStock.IOrderResponse> {
    // Validate limit order has price
    if (input.orderCondition === "limit" && !input.price) {
      return {
        success: false,
        message: "Price is required for limit orders",
        errorCode: "MISSING_PRICE",
      };
    }

    // Convert stock name to stock code
    const conversionResult = await this.convertStockNameToCode(input.stockName);
    if (!conversionResult.success) {
      return conversionResult.error;
    }

    // Notify client about stock focus
    await this.notifyStockFocus(input.stockName, conversionResult.stockCode, listener);

    // Request confirmation from client
    const confirmed = await this.requestTradingConfirmation(
      input.stockName,
      conversionResult.stockCode,
      'sell',
      input,
      listener
    );

    if (!confirmed) {
      return {
        success: false,
        message: "매도 주문이 사용자에 의해 취소되었습니다.",
        errorCode: "USER_CANCELLED",
      };
    }

    // Execute the sell order using provided session data
    return await this.tradingProvider.executeStockOrder(sessionData, {
      stockCode: conversionResult.stockCode,
      orderType: "sell",
      quantity: input.quantity,
      price: input.price,
      orderCondition: input.orderCondition,
    });
  }

  /**
   * 주식 현재가 조회
   */
  public async getStockPrice(
    sessionData: IKisSessionData,
    input: {
      stockName: string;
    },
    listener?: IClientEvents
  ): Promise<{
    message: string;
    data: Record<string, any>;
  }> {
    // Convert stock name to stock code
    const conversionResult = await this.convertStockNameToCode(input.stockName);
    if (!conversionResult.success) {
      throw new Error(`Stock not found: ${input.stockName}`);
    }

    // Notify client about stock focus
    await this.notifyStockFocus(input.stockName, conversionResult.stockCode, listener);

    const result = await this.priceProvider.fetchStockPrice(
      { stockCode: conversionResult.stockCode },
      sessionData,
    );
    return {
      message: `${input.stockName}의 현재 주가 정보입니다.`,
      data: result,
    };
  }

  /**
   * 국내 주식 체결 정보 조회
   */
  public async getStockTrades(
    sessionData: IKisSessionData,
    input: {
      stockName: string;
    }
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    // Convert stock name to stock code
    const conversionResult = await this.convertStockNameToCode(input.stockName);
    if (!conversionResult.success) {
      throw new Error(`Stock not found: ${input.stockName}`);
    }

    const result = await this.priceProvider.fetchStockTrades(
      { stockCode: conversionResult.stockCode },
      sessionData,
    );
    return {
      message: `${input.stockName}의 실시간 체결 정보입니다.`,
      data: result,
    };
  }

  /**
   * 국내 주식 일자별 가격 조회
   */
  public async getStockDailyPrices(
    sessionData: IKisSessionData,
    input: {
      stockName: string;
      periodCode?: "D" | "W" | "M";
      adjustPrice?: 0 | 1;
    },
    listener?: IClientEvents
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    // Convert stock name to stock code
    const conversionResult = await this.convertStockNameToCode(input.stockName);
    if (!conversionResult.success) {
      throw new Error(`Stock not found: ${input.stockName}`);
    }

    // Notify client about stock focus
    await this.notifyStockFocus(input.stockName, conversionResult.stockCode, listener);

    const result = await this.priceProvider.fetchStockDailyPrices(
      {
        stockCode: conversionResult.stockCode,
        periodCode: input.periodCode ?? "D",
        adjustPrice: input.adjustPrice ?? 1,
      },
      sessionData,
    );
    return {
      message: `${input.stockName}의 ${input.periodCode ?? "D"} 단위 시세 정보입니다.`,
      data: result,
    };
  }

  /**
   * 코스피 지수 일/주/월/년 시세 조회
   */
  public async getKospiPrices(
    sessionData: IKisSessionData,
    input: {
      periodCode?: "D" | "W" | "M" | "Y";
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    const result = await this.priceProvider.fetchKospiIndexPrices(
      input.periodCode ?? "D",
      input.startDate,
      input.endDate,
      sessionData,
    );
    return {
      message: `코스피 지수의 ${input.periodCode ?? "D"} 단위 시세 정보입니다.`,
      data: result,
    };
  }

  /**
   * Get comprehensive portfolio data
   */
  public async getPortfolioData(sessionData: IKisSessionData): Promise<IKisPortfolio.IPortfolioResponse> {
    // Execute portfolio data inquiry using provided session data
    return await this.balanceProvider.getPortfolioData(sessionData);
  }

  /**
   * Get portfolio summary for header
   */
  public async getPortfolioSummary(sessionData: IKisSessionData): Promise<IKisPortfolio.IPortfolioSummary> {
    // Execute portfolio summary inquiry using provided session data
    return await this.balanceProvider.getPortfolioSummary(sessionData);
  }

  /**
   * 보유 잔고 (주식) 조회
   * @param sessionData KIS 세션 데이터
   * @returns 보유 주식 목록과 계좌 정보
   */
  public async getBalances(
    sessionData: IKisSessionData,
  ): Promise<IKisPortfolio.IBalanceResponse> {
    try {
      const response = await this.balanceProvider.getStockBalances(sessionData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Notify client about stock focus change
   */
  private async notifyStockFocus(stockName: string, stockCode: string, listener?: IClientEvents): Promise<void> {
    if (listener && listener.onStockFocus) {
      try {
        // StockCodeService에서 주식 정보를 조회하여 market 정보도 포함
        const searchResults = this.stockCodeService.searchStocks(stockName, 1);
        const stockInfo = searchResults.length > 0 ? searchResults[0] : null;

        await listener.onStockFocus({
          code: stockCode,
          name: stockName,
          market: stockInfo?.market || 'KOSPI' // 기본값으로 KOSPI 설정
        });
      } catch (error) {
        console.error('Failed to notify stock focus:', error);
      }
    }
  }
}
