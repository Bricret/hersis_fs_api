import { IsString, IsNotEmpty } from 'class-validator';

export class CancelSaleDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
} 