import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { Cash } from './entities/cash.entity';
import { Branch } from 'src/branches/intities/branches.entity';
import { User } from 'src/users/entities/user.entity';
import { Sale } from 'src/sales/entities/sale.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cash, Branch, User, Sale])
  ],
  controllers: [CashController],
  providers: [CashService],
  exports: [CashService, TypeOrmModule],
})
export class CashModule {} 