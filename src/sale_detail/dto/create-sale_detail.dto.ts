import { IsNumber, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class CreateSaleDetailDto {
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unit_price: number;

  @IsNumber()
  @IsPositive()
  productId: number;

  @IsString()
  @IsNotEmpty()
  product_type: 'medicine' | 'general';
}
