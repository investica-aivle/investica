import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NewsService } from '../../providers/news/NewsService';
import { NewsController } from './NewsController';

@Module({
  imports: [HttpModule, ConfigModule],   
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
