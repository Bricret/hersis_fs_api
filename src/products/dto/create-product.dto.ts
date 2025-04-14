import { IsString, IsNumber, IsBoolean, IsDate, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  sales_price: number;

  @IsNumber()
  @IsNotEmpty()
  purchase_price: number;

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
  expiration_date: Date;

  @IsNumber()
  @IsNotEmpty()
  category_id: number;

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
  registration_number?: string;

  @IsOptional()
  @IsString()
  storage_conditions?: string;

  @IsOptional()
  @IsArray()
  active_ingredients?: string[];

  @IsOptional()
  @IsString()
  warnings?: string;

  @IsOptional()
  @IsString()
  administration_route?: string;

  // Campos específicos de productos generales
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  warranty_period?: string;

  @IsOptional()
  @IsString()
  country_of_origin?: string;
}
