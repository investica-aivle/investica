import { Module } from '@nestjs/common';
import { StockBalanceService } from './StockBalanceService';
import { STOCK_BALANCE_PROVIDERS } from './StockBalanceProvider';

@Module({
  providers: [
    ...STOCK_BALANCE_PROVIDERS, // 재료창고 연결
    StockBalanceService         // 실제 일하는 곳 연결
  ],
  exports: [StockBalanceService] // 다른 곳에서 사용 가능하게
})
export class StockBalanceModule {}