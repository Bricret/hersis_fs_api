import { IsObject, IsOptional, IsString } from "class-validator";


export class CreateTransactionHistoryDto {

    @IsString()
    action: string;

    @IsString()
    entity: string;

    @IsObject()
    @IsOptional()
    details?: object;

}
