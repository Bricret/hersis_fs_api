import { Controller, Get, Post, Body } from '@nestjs/common';
import { TransactionHistoryService } from './transaction_history.service';
import { CreateTransactionHistoryDto } from './dto/create-transaction_history.dto';

@Controller('transaction-history')
export class TransactionHistoryController {
  constructor(private readonly transactionHistoryService: TransactionHistoryService) {}

  @Post()
  create(@Body() createTransactionHistoryDto: CreateTransactionHistoryDto) {
    return this.transactionHistoryService.logTransaction(createTransactionHistoryDto);
  }

  @Get()
  findAll() {
    return this.transactionHistoryService.findAll();
  }
}
