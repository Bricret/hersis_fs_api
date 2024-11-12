import { IsDate, IsNotEmpty } from "class-validator";


export class CreateReportDto {

    @IsDate()
    @IsNotEmpty()
    date_from: Date;

    @IsDate()
    @IsNotEmpty()
    date_to: Date;

    @IsNotEmpty()
    user_id?: number;
}