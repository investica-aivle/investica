import { Injectable } from "@nestjs/common";
import { IKisSessionData, IKisStock } from "@models/KisTrading";
import { tags } from "typia";

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
  private async convertStockNameToCode(stockName: string): Promise<{ success: true; stockCode: string } | { success: false; error: IKisStock.IOrderResponse }> {
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
   * Execute stock buy order
   */
  public async buyStock(
    sessionData: IKisSessionData,
    input: {
      stockName: string;
      quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;
      orderCondition: "market" | "limit";
      price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
    }
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
    }
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
    }
  ): Promise<{
    message: string;
    data: Record<string, any>;
  }> {
    // Convert stock name to stock code
    const conversionResult = await this.convertStockNameToCode(input.stockName);
    if (!conversionResult.success) {
      throw new Error(`Stock not found: ${input.stockName}`);
    }

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
   * Get account stock balance
   */
  public async getStockBalance(sessionData: IKisSessionData): Promise<{
    message: string;
    stocks: Array<{
      name: string;
      quantity: string;
      buyPrice: string;
      currentPrice: string;
      profit: string;
    }>;
  }> {
    // Execute balance inquiry using provided session data
    return await this.balanceProvider.getStockBalance(sessionData);
  }
}
