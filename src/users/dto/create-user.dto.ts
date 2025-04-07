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
    @IsIn(['admin', 'user', 'pharmacist'])
    role: string;

    @IsString()
    @IsIn(['sucursal_1', 'sucursal_2'])
    branch: string;

}
