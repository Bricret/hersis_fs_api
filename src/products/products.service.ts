import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ProductsService {
  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly commonService: CommonService,

  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const productExist = await this.productRepository.findOne({
        where: { name: createProductDto.name },
      });

      if (productExist) throw new Error('Product already exists');

      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findAll() {

    try {
      return await this.productRepository.find();
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }

  }

  async findOne(id: bigint) {

    try {
      return await this.productRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'NF');
    }

  }

  async update(id: bigint, updateProductDto: UpdateProductDto) {

    try {
      
      const findProduct = await this.productRepository.findOne({
        where: { id },
      });

      if (!findProduct) this.commonService.handleExceptions('El producto solicitado no fue encontrado.', 'NF');

      const product = this.productRepository.create(updateProductDto);
      product.id = id;
      return await this.productRepository.save(product);
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async remove(id: bigint) {

    try {
      const product = await this.productRepository.findOne({
        where: { id },
      });

      if (!product) this.commonService.handleExceptions('El producto solicitado no fue encontrado.', 'NF');

      return await this.productRepository.delete({
        id,
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }

  }
}
