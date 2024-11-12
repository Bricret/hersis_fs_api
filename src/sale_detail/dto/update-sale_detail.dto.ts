import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleDetailDto } from './create-sale_detail.dto';

export class UpdateSaleDetailDto extends PartialType(CreateSaleDetailDto) {}
