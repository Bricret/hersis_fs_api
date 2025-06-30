import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { CommonModule } from 'src/common/common.module';
import { Branch } from 'src/branches/intities/branches.entity';
import { Cash } from 'src/cash/entities/cash.entity';
import { SaleDetail } from 'src/sale_detail/entities/sale_detail.entity';
import { SaleDetailModule } from 'src/sale_detail/sale_detail.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      Branch,
      Cash,
      SaleDetail,
      User
    ]),
    CommonModule,
    SaleDetailModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
