import { Module } from "@nestjs/common";
import { KisTradingProvider } from "../../providers/kis/KisTradingProvider";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";
import { KisPriceProvider } from "../../providers/kis/KisPriceProvider";
import { KisBalanceProvider } from "../../providers/kis/KisBalanceProvider";
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
  providers: [KisTradingProvider, KisAuthProvider, KisPriceProvider, KisBalanceProvider],
  exports: [KisTradingProvider, KisAuthProvider, KisPriceProvider, KisBalanceProvider],
})
export class KisModule {}
