import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class CreateBranchDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsPhoneNumber()
    phone: string;
} 