import { IsNumber, IsString, IsUUID, IsOptional, IsPositive } from 'class-validator';

export class CloseCashDto {
    
    @IsNumber()
    @IsPositive()
    monto_final: number;

    @IsUUID()
    user_cierre_id: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
} 