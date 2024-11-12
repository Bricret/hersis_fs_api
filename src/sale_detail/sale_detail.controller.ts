import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SaleDetailService } from './sale_detail.service';
import { CreateSaleDetailDto } from './dto/create-sale_detail.dto';
import { UpdateSaleDetailDto } from './dto/update-sale_detail.dto';

@Controller('sale-detail')
export class SaleDetailController {
  constructor(private readonly saleDetailService: SaleDetailService) {}

  @Post()
  create(@Body() createSaleDetailDto: CreateSaleDetailDto) {
    return this.saleDetailService.create(createSaleDetailDto);
  }

  @Get()
  findAll() {
    return this.saleDetailService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleDetailService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSaleDetailDto: UpdateSaleDetailDto) {
    return this.saleDetailService.update(+id, updateSaleDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleDetailService.remove(+id);
  }
}
