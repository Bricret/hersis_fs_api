import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleDetailDto } from './create-sale_detail.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateSaleDetailDto extends PartialType(CreateSaleDetailDto) {
  @IsOptional()
  @IsNumber()
  subtotal?: number;
}
