import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";

//TODO: Implementar utilizacion de reduccion de costos y logs de peticiones
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
