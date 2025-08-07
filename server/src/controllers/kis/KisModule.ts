import { Module } from "@nestjs/common";
import { KisTradingProvider } from "../../providers/kis/KisTradingProvider";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";
import { StocksProvider } from "../../providers/stocks/StocksProvider";
import { StockBalanceProvider } from "../../providers/stockBalance/StockBalanceProvider";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";

/**
 * KIS (Korea Investment Securities) Module
 *
 * This module provides KIS providers for trading functionality.
 * The providers are used by ChatModule for WebSocket-based trading operations.
 */
@Module({
  imports: [
    HttpModule,
    ConfigModule, // 둘 다 주입에 필요
  ],
  providers: [KisTradingProvider, KisAuthProvider, StocksProvider, StockBalanceProvider],
  exports: [KisTradingProvider, KisAuthProvider, StocksProvider, StockBalanceProvider],
})
export class KisModule {}
