import { IsNumber, IsUUID } from "class-validator";


export class CreateSaleDto {

    @IsNumber()
    total: number;

    @IsUUID()
    branch_id: string;
}
