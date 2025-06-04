import { PartialType } from '@nestjs/mapped-types';
import { CreateCashDto } from './create-cash.dto';

export class UpdateCashDto extends PartialType(CreateCashDto) {} 