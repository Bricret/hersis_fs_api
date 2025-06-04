import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { CommonModule } from 'src/common/common.module';
import { Branch } from 'src/branches/intities/branches.entity';
import { Cash } from 'src/cash/entities/cash.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      Branch,
      Cash
    ]),

    CommonModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
