import { Controller, Get, Post, Body, Patch, Param, Query, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkInventoryEntryDto } from './dto/bulk-inventory-entry.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { DeleteProductsDto } from './dto/delete-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto | CreateProductDto[]) {
    return this.productsService.create(createProductDto);
  }

  @Post('/inventory-entries')
  async createBulkInventoryEntries(@Body() bulkEntryDto: BulkInventoryEntryDto) {
    return this.productsService.addBulkInventoryEntries(bulkEntryDto, bulkEntryDto.type);
  }

  @Post('/bulk')
  async createBulk(@Body() body: { inventory: CreateProductDto[] }) {
    return this.productsService.createBulk(body.inventory);
  }
  
  @Get()
  findAll(@Query() findProductsDto: FindProductsDto) {
    return this.productsService.findAll(findProductsDto);
  }

  @Delete('/deletebulk/:user_delete')
  deleteProducts(@Param('user_delete') user_delete: string, @Body() deleteProductsDto: DeleteProductsDto) {
    return this.productsService.deleteProducts(user_delete, deleteProductsDto);
  }
  
  @Get(':id')
  findOne(@Param('id') id: bigint, @Body() body: {type: string}) {
    return this.productsService.findOne(id, body.type);
  }

  @Patch('/refill/:id')
  refillProduct(@Param('id') id: bigint, @Body() body: { refill: number, type: string }) {
    return this.productsService.refillProduct(id, body)
  }

  @Patch(':id')
  update(@Param('id') id: bigint, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch('/updatePrice/:id')
  updatePriceProduct(@Param('id') id: bigint, @Body() body: { type: string, newPrice: number }) {
    return this.productsService.updatePriceProduct(id, body)
  }

  @Patch('/disable/:id')
  remove(@Param('id') id: bigint, @Body() body: { type: string }) {
    return this.productsService.remove(id, body.type);
  }

  @Delete('/:id')
  deleteProduct(@Param('id') id: bigint, @Body() body: { type: string, user_delete: string }) {
    return this.productsService.deleteProduct(BigInt(id), body.type, body.user_delete);
  }
}
