import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { StocksOverviewProvider } from "../../providers/stocks/StocksOverviewProvider";
import { StocksOverviewController } from "./StocksOverviewController";

@Module({
  imports: [HttpModule],
  controllers: [StocksOverviewController],
  providers: [StocksOverviewProvider],
  exports: [StocksOverviewProvider],
})
export class StockOverviewModule {}
