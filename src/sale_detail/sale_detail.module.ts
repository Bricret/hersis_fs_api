import { Module } from '@nestjs/common';
import { SaleDetailService } from './sale_detail.service';
import { SaleDetailController } from './sale_detail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleDetail } from './entities/sale_detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleDetail]),
  ],
  controllers: [SaleDetailController],
  providers: [SaleDetailService],
})
export class SaleDetailModule {}
