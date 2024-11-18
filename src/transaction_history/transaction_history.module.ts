import { Module } from '@nestjs/common';
import { TransactionHistoryService } from './transaction_history.service';
import { TransactionHistoryController } from './transaction_history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionHistory } from './entities/transaction_history.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionHistory,
    ]),

    CommonModule,
  ],
  controllers: [TransactionHistoryController],
  providers: [TransactionHistoryService],
})
export class TransactionHistoryModule {}
