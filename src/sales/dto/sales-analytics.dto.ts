import { IsDateString, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class SalesAnalyticsDto {
  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  top_products_limit?: number = 10;

  @IsOptional()
  @IsUUID()
  cash_id?: string;
} 