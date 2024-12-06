import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { InventoryEntriesDto } from './dto/inventory_entries.dto';
import { BulkInventoryEntryDto } from './dto';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categorieService: CategoryService,
    private readonly commonService: CommonService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const productExist = await this.productRepository.findOne({
        where: { name: createProductDto.name },
      });

      const categorie = await this.categorieService.findOne(createProductDto.categories_id);

      if (productExist) throw new Error('Product already exists');

      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save({
        ...product,
        category: categorie,
      });
      return product;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async addInventoryEntry(createEntryDto: InventoryEntriesDto) {
    const product = await this.productRepository.findOneBy({
      id: createEntryDto.productId,
    });
    if (!product)
      this.commonService.handleExceptions(
        'El producto solicitado no fue encontrado.',
        'NF',
      );

    const newQuantity = createEntryDto.quantity;
    const newCostPrice = product.cost_price;
    const stockQuantity = product.quantity;
    const currentAverageCost = product.cost_price;

    product.quantity += newQuantity;
    product.cost_price = this.calculateNewAverageCost(
      stockQuantity,
      currentAverageCost,
      newQuantity,
      newCostPrice,
    );

    await this.productRepository.save(product);

    return { message: 'Inventario actualizado exitosamente.', product };
  }

  async addBulkInventoryEntries(bulkEntryDto: BulkInventoryEntryDto) {
    const results = [];

    for (const entry of bulkEntryDto.entries) {
      const product = await this.productRepository.findOne({
        where: { id: entry.productId },
      });

      if (!product)
        this.commonService.handleExceptions(
          `El producto ${entry.productId} no fue encontrado.`,
          'NF',
        );

        const data = await this.addInventoryEntry(entry);
        results.push(data);
    }

  }

  private calculateNewAverageCost(
    currentStock: number,
    currentAverageCost: number,
    newQuantity: number,
    newCostPrice: number,
  ): number {
    const totalValue =
      currentAverageCost * (currentStock - newQuantity) +
      newCostPrice * newQuantity;
    return totalValue / currentStock;
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

      if (!findProduct)
        this.commonService.handleExceptions(
          'El producto solicitado no fue encontrado.',
          'NF',
        );

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

      if (!product)
        this.commonService.handleExceptions(
          'El producto solicitado no fue encontrado.',
          'NF',
        );

      return await this.productRepository.delete({
        id,
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }
}
