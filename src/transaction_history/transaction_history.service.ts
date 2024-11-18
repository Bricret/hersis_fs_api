import { Injectable } from '@nestjs/common';
import { CreateTransactionHistoryDto } from './dto/create-transaction_history.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHistory } from './entities/transaction_history.entity';
import { Repository } from 'typeorm';
import { CommonService } from '../common/common.service';

@Injectable()
export class TransactionHistoryService {
  constructor(
    @InjectRepository(TransactionHistory)
    private transactionHistoryRepository: Repository<TransactionHistory>,

    private readonly CommonService: CommonService,
  ) {}

  async logTransaction(
    createTransactionHistoryDto: CreateTransactionHistoryDto,
  ) {
    try {
      const NewTransaction = this.transactionHistoryRepository.create(
        createTransactionHistoryDto,
      );

      await this.transactionHistoryRepository.save(NewTransaction);

      return NewTransaction;
    } catch (error) {
      this.CommonService.handleExceptions(error, 'BR');
    }
  }

  async findAll() {
    try {
      return await this.transactionHistoryRepository.find();
    } catch (error) {
      this.CommonService.handleExceptions(error, 'BR');
    }
  }
}
