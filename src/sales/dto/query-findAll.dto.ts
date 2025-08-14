import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";


export class QueryFindAllDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}