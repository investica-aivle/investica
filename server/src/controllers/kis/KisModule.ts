import { Module } from "@nestjs/common";
import { KisTradingProvider } from "../../providers/kis/KisTradingProvider";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";
import { KisPriceProvider } from "../../providers/kis/KisPriceProvider";
import { KisBalanceProvider } from "../../providers/kis/KisBalanceProvider";
import { KisService } from "../../providers/kis/KisService";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { KisController } from "./KisController";
import { SessionManager } from "../../providers/session/SessionManager";
import { StockModule } from "../stock/StockModule";

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
    StockModule, // StockCodeService를 사용하기 위해 import
  ],
  providers: [KisTradingProvider, KisAuthProvider, KisPriceProvider, KisBalanceProvider, KisService, SessionManager],
  controllers: [KisController],
  exports: [KisTradingProvider, KisAuthProvider, KisPriceProvider, KisBalanceProvider, KisService, SessionManager],
})
export class KisModule {}
