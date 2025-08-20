import { IsEmail, IsIn, IsString, IsUUID } from "class-validator";


export class CreateUserDto {

    @IsString()
    name: string;

    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsString()
    @IsIn(['admin', 'user', 'pharmacist'])
    role: string;

    @IsUUID()
    branch: string;

}
