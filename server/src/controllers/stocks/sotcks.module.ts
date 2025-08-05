import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { StocksService } from '../../providers/stocks/stocks.service';
import { StocksController } from './stocks.controllers';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
