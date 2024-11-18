import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionHistoryDto } from './create-transaction_history.dto';

export class UpdateTransactionHistoryDto extends PartialType(CreateTransactionHistoryDto) {}
