import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { actions } from '../entities/logs.entity';

export class CreateLogsDto {

    @IsEnum(actions)
    action:      string;

    @IsString()
    @IsNotEmpty()
    entity:      string;
    
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    @IsUUID()
    userId:      string;

    @IsNotEmpty()
    @IsDateString()
    timestamp:   Date;
}