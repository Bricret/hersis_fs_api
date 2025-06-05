import { Controller, Get, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SaleDetailService } from './sale_detail.service';
import { UpdateSaleDetailDto } from './dto/update-sale_detail.dto';

@Controller('sale-detail')
export class SaleDetailController {
  constructor(private readonly saleDetailService: SaleDetailService) {}

  @Get()
  findAll() {
    return this.saleDetailService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleDetailService.findOne(+id);
  }

  @Get('by-sale/:saleId')
  findBySale(@Param('saleId') saleId: string) {
    return this.saleDetailService.findBySale(+saleId);
  }

  @Get('product/:productId')
  getProductDetails(
    @Param('productId') productId: string,
    @Query('type') type: 'medicine' | 'general'
  ) {
    return this.saleDetailService.getProductDetails(+productId, type);
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
