import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductToDeleteDto {
  @IsString()
  id: string;

  @IsString()
  type: string;
}

export class DeleteProductsDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductToDeleteDto)
  products?: ProductToDeleteDto[];
} 