import { IsNumber, IsString, IsUUID, IsOptional, IsPositive } from 'class-validator';

export class CreateCashDto {
    
    @IsNumber()
    @IsPositive()
    monto_inicial: number;

    @IsUUID()
    branch_id: string;

    @IsUUID()
    user_apertura_id: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}