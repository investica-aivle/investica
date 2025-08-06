import { Module } from "@nestjs/common";
import { KisTradingProvider } from "../../providers/kis/KisTradingProvider";
import { KisAuthProvider } from "../../providers/kis/KisAuthProvider";

/**
 * KIS (Korea Investment Securities) Module
 *
 * This module provides KIS providers for trading functionality.
 * The providers are used by ChatModule for WebSocket-based trading operations.
 */
@Module({
  providers: [KisTradingProvider, KisAuthProvider],
  exports: [KisTradingProvider, KisAuthProvider],
})
export class KisModule {}
