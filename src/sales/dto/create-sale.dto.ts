import { IsNumber, IsUUID, IsArray, ValidateNested, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { CreateSaleDetailDto } from "src/sale_detail/dto/create-sale_detail.dto";

export class CreateSaleDto {

    @IsOptional()
    @IsNumber()
    total?: number;

    @IsUUID()
    branch_id: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleDetailDto)
    saleDetails: CreateSaleDetailDto[];
}
