
import { IsString } from "class-validator";


export class CreatePresentationDto {

    @IsString()
    name: string;

}
