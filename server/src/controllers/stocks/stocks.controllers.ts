import { Body, Controller, Post } from '@nestjs/common';
import { StocksService } from '../../providers/stocks/stocks.service';

interface StockRequestDto {
  company: string;
  accessToken: string;
  appKey: string;
  appSecret: string;
}

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post('price')
  async getStockPrice(@Body() body: StockRequestDto) {
    return await this.stocksService.fetchStockPrice(body);
  }
}