import { Injectable } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  create(createSaleDto: CreateSaleDto) {
    return 'This action adds a new sale';
  }

  findAll() {
    return `This action returns all sales`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sale`;
  }

  remove(id: number) {
    return `This action removes a #${id} sale`;
  }
}
