import { IsNumber } from "class-validator";


export class CreateSaleDto {

    @IsNumber()
    total: number;
}
