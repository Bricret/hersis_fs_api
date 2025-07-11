import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  sales_price?: number;

  @IsNumber()
  @IsOptional()
  purchase_price?: number;

  @IsNumber()
  @IsNotEmpty()
  initial_quantity: number;

  @IsString()
  @IsNotEmpty()
  barCode: string;

  @IsNumber()
  @IsNotEmpty()
  units_per_box: number;

  @IsString()
  @IsNotEmpty()
  lot_number: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value;
  })
  expiration_date: Date;

  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @IsString()
  @IsNotEmpty()
  branch_id: string;

  @IsString()
  @IsNotEmpty()
  type: 'medicine' | 'general';

  // Campos específicos de medicamentos
  @IsOptional()
  @IsString()
  active_name?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsBoolean()
  prescription?: boolean;

  @IsOptional()
  @IsString()
  laboratory?: string;

  @IsOptional()
  @IsString()
  administration_route?: string;

  @IsOptional()
  @IsNumber()
  presentation_id?: number;

  // Campos específicos de productos generales
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  user_create?: string;
}
