import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TransactionHistoryService } from './transaction_history.service';
import { CreateTransactionHistoryDto } from './dto/create-transaction_history.dto';
import { UpdateTransactionHistoryDto } from './dto/update-transaction_history.dto';

@Controller('transaction-history')
export class TransactionHistoryController {
  constructor(private readonly transactionHistoryService: TransactionHistoryService) {}

  @Post()
  create(@Body() createTransactionHistoryDto: CreateTransactionHistoryDto) {
    return this.transactionHistoryService.create(createTransactionHistoryDto);
  }

  @Get()
  findAll() {
    return this.transactionHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionHistoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionHistoryDto: UpdateTransactionHistoryDto) {
    return this.transactionHistoryService.update(+id, updateTransactionHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionHistoryService.remove(+id);
  }
}
