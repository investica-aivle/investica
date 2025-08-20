import { Module } from '@nestjs/common';
import { StockCodeService } from '../../providers/stock/StockCodeService';
import { StockController } from './StockController';

@Module({
  providers: [StockCodeService],
  controllers: [StockController],
  exports: [StockCodeService],
})
export class StockModule {}
