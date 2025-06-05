import { Module } from '@nestjs/common';
import { SaleDetailService } from './sale_detail.service';
import { SaleDetailController } from './sale_detail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleDetail } from './entities/sale_detail.entity';
import { GeneralProduct } from 'src/products/entities/general-product.entity';
import { Medicine } from 'src/products/entities/medicine.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleDetail, GeneralProduct, Medicine]),
    CommonModule,
  ],
  controllers: [SaleDetailController],
  providers: [SaleDetailService],
  exports: [SaleDetailService],
})
export class SaleDetailModule {}
