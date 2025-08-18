import { IKisSessionData, IKisStock } from "@models/KisTrading";
import { Injectable } from "@nestjs/common";
import { tags } from "typia";

import { KisBalanceProvider } from "./KisBalanceProvider";
import { KisPriceProvider } from "./KisPriceProvider";
import { KisTradingProvider } from "./KisTradingProvider";

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
  ) {}

  /**
   * Execute stock buy order
   */
  public async buyStock(
    sessionData: IKisSessionData,
    input: {
      stockCode: string & tags.Pattern<"^[0-9]{6}$">;
      quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;
      orderCondition: "market" | "limit";
      price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
    },
  ): Promise<IKisStock.IOrderResponse> {
    // Validate limit order has price
    if (input.orderCondition === "limit" && !input.price) {
      return {
        success: false,
        message: "Price is required for limit orders",
        errorCode: "MISSING_PRICE",
      };
    }

    // Execute the buy order using provided session data
    return await this.tradingProvider.executeStockOrder(sessionData, {
      stockCode: input.stockCode,
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
      stockCode: string & tags.Pattern<"^[0-9]{6}$">;
      quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;
      orderCondition: "market" | "limit";
      price?: number & tags.Type<"uint32"> & tags.Minimum<1>;
    },
  ): Promise<IKisStock.IOrderResponse> {
    // Validate limit order has price
    if (input.orderCondition === "limit" && !input.price) {
      return {
        success: false,
        message: "Price is required for limit orders",
        errorCode: "MISSING_PRICE",
      };
    }

    // Execute the sell order using provided session data
    return await this.tradingProvider.executeStockOrder(sessionData, {
      stockCode: input.stockCode,
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
      company: string;
    },
  ): Promise<{
    message: string;
    data: Record<string, any>;
  }> {
    const result = await this.priceProvider.fetchStockPrice(
      { company: input.company },
      sessionData,
    );
    return {
      message: `${input.company}의 현재 주가 정보입니다.`,
      data: result,
    };
  }

  /**
   * 국내 주식 체결 정보 조회
   */
  public async getStockTrades(
    sessionData: IKisSessionData,
    input: {
      company: string;
    },
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    const result = await this.priceProvider.fetchStockTrades(
      { company: input.company },
      sessionData,
    );
    return {
      message: `${input.company}의 실시간 체결 정보입니다.`,
      data: result,
    };
  }

  /**
   * 국내 주식 일자별 가격 조회
   */
  public async getStockDailyPrices(
    sessionData: IKisSessionData,
    input: {
      company: string;
      periodCode?: "D" | "W" | "M";
      adjustPrice?: 0 | 1;
    },
  ): Promise<{
    message: string;
    data: Record<string, any>[];
  }> {
    const result = await this.priceProvider.fetchStockDailyPrices(
      {
        company: input.company,
        periodCode: input.periodCode ?? "D",
        adjustPrice: input.adjustPrice ?? 1,
      },
      sessionData,
    );
    return {
      message: `${input.company}의 ${input.periodCode ?? "D"} 단위 시세 정보입니다.`,
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
