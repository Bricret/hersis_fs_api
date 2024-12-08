import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateProductDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNumber()
    @IsNotEmpty()
    categories_id: number;

    @IsNumber()
    cost_price: number;

    @IsNumber()
    units_per_blister?: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsDateString()
    expiration_date: string;

}
