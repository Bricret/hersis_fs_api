import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseProduct } from './entities/base-product.entity';
import { Medicine } from './entities/medicine.entity';
import { GeneralProduct } from './entities/general-product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkInventoryEntryDto } from './dto/bulk-inventory-entry.dto';
import { CommonService } from 'src/common/common.service';
import { CategoryService } from 'src/category/category.service';
import { LogsService } from 'src/logs/logs.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(BaseProduct)
    private baseProductRepository: Repository<BaseProduct>,
    @InjectRepository(Medicine)
    private medicineRepository: Repository<Medicine>,
    @InjectRepository(GeneralProduct)
    private generalProductRepository: Repository<GeneralProduct>,
    private readonly categorieService: CategoryService,
    private readonly commonService: CommonService,
    private readonly logsService: LogsService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const category = await this.categorieService.findOne(createProductDto.category_id);

      if (createProductDto.type === 'medicine') {
        const medicine = this.medicineRepository.create(createProductDto);
        await this.medicineRepository.save({
          ...medicine,
          category,
        });

        await this.logsService.createLog({
          action: 'create',
          entity: 'medicine',
          description: `Medicamento ${medicine.name} creado exitosamente.`,
          userId: '1',
          timestamp: new Date(),
        });

        return medicine;
      } else {
        const generalProduct = this.generalProductRepository.create(createProductDto);
        await this.generalProductRepository.save({
          ...generalProduct,
          category,
        });

        await this.logsService.createLog({
          action: 'create',
          entity: 'general_product',
          description: `Producto general ${generalProduct.name} creado exitosamente.`,
          userId: '1',
          timestamp: new Date(),
        });

        return generalProduct;
      }
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findAll() {
    try {
      const medicines = await this.medicineRepository.find();
      const generalProducts = await this.generalProductRepository.find();
      return [...medicines, ...generalProducts];
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findOne(id: bigint) {
    try {
      const medicine = await this.medicineRepository.findOne({ where: { id } });
      if (medicine) return medicine;

      const generalProduct = await this.generalProductRepository.findOne({ where: { id } });
      if (!generalProduct) {
        this.commonService.handleExceptions('El producto solicitado no fue encontrado.', 'NF');
      }
      return generalProduct;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'NF');
    }
  }

  async update(id: bigint, updateProductDto: UpdateProductDto) {
    try {
      const medicine = await this.medicineRepository.findOne({ where: { id } });
      if (medicine) {
        await this.medicineRepository.update({ id }, updateProductDto);
        return this.medicineRepository.findOne({ where: { id } });
      }

      const generalProduct = await this.generalProductRepository.findOne({ where: { id } });
      if (!generalProduct) {
        this.commonService.handleExceptions('El producto solicitado no fue encontrado.', 'NF');
      }
      return this.generalProductRepository.update({id}, updateProductDto);
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async remove(id: bigint) {
    try {
      const medicine = await this.medicineRepository.findOne({ where: { id } });
      if (medicine) {
        return this.medicineRepository.remove(medicine);
      }

      const generalProduct = await this.generalProductRepository.findOne({ where: { id } });
      if (!generalProduct) {
        this.commonService.handleExceptions('El producto solicitado no fue encontrado.', 'NF');
      }
      return this.generalProductRepository.remove(generalProduct);
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async addInventoryEntry(entry: { productId: bigint; quantity: number; expirationDate: Date }) {
    try {
      const product = await this.findOne(entry.productId);
      if (!product) {
        this.commonService.handleExceptions('El producto solicitado no fue encontrado.', 'NF');
      }

      const newQuantity = entry.quantity;
      const newCostPrice = product.purchase_price;
      const stockQuantity = product.initial_quantity;
      const currentAverageCost = product.purchase_price;

      product.initial_quantity += newQuantity;
      product.purchase_price = this.calculateNewAverageCost(
        stockQuantity,
        currentAverageCost,
        newQuantity,
        newCostPrice,
      );

      if (product instanceof Medicine) {
        await this.medicineRepository.save({
          ...product,
          expiration_date: entry.expirationDate,
        });
      } else {
        await this.generalProductRepository.save({
          ...product,
          expiration_date: entry.expirationDate,
        });
      }

      return { message: 'Inventario actualizado exitosamente.', product };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async addBulkInventoryEntries(bulkEntryDto: BulkInventoryEntryDto) {
    try {
      const results = [];

      for (const entry of bulkEntryDto.entries) {
        const product = await this.findOne(entry.productId);
        if (!product) {
          this.commonService.handleExceptions(
            `El producto ${entry.productId} no fue encontrado.`,
            'NF',
          );
        }

        const data = await this.addInventoryEntry(entry);
        results.push(data);
      }

      return {
        message: 'Inventario actualizado correctamente.',
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
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
}
