import { IsEmail, IsIn, IsString } from "class-validator";


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
    @IsIn(['admin', 'user'])
    role: string;

}
