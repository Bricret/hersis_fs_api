import { IsDateString, IsInt, IsPositive, IsString } from "class-validator";


export class InventoryEntriesDto {

    @IsString()
    productId: bigint;

    @IsInt()
    @IsPositive()
    quantity: number;

    @IsDateString()
    expirationDate: Date;
}