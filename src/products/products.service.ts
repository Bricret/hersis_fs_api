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
import { FindProductsDto } from './dto/find-products.dto';

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

    console.log('se ejecuto?')

    console.log(createProductDto)

    try {
      const category = await this.categorieService.findOne(createProductDto.category_id);
      if (createProductDto.type === 'medicine') {
        const medicineData = {
          ...createProductDto,
          category,
          presentation_id: createProductDto.presentation_id
        };
        const medicine = this.medicineRepository.create(medicineData);
        await this.medicineRepository.save(medicine);

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
          description: `Producto ${generalProduct.name} registrado exitosamente.`,
          userId: '1',
          timestamp: new Date(),
        });

        return generalProduct;
      }
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findAll(findProductsDto: FindProductsDto) {
    try {
      const { search, page = 1, limit = 10 } = findProductsDto;
      
      const medicineQueryBuilder = this.medicineRepository.createQueryBuilder('medicine')
        .leftJoinAndSelect('medicine.category', 'category');
      
      const generalProductQueryBuilder = this.generalProductRepository.createQueryBuilder('generalProduct')
        .leftJoinAndSelect('generalProduct.category', 'category');

      if (search && search.length > 0) {
        const searchPattern = `%${search}%`;
        medicineQueryBuilder.where(
          'medicine.name LIKE :search OR medicine.description LIKE :search OR medicine.barCode LIKE :search',
          { search: searchPattern }
        );
        generalProductQueryBuilder.where(
          'generalProduct.name LIKE :search OR generalProduct.description LIKE :search OR generalProduct.barCode LIKE :search',
          { search: searchPattern }
        );
      }

      const skip = (page - 1) * limit;

      const [medicines, totalMedicines] = await medicineQueryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const [generalProducts, totalGeneralProducts] = await generalProductQueryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const total = totalMedicines + totalGeneralProducts;
      const allProducts = [...medicines, ...generalProducts];

      return {
        data: allProducts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
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
        const { presentation_id, ...medicineData } = updateProductDto;
        await this.medicineRepository.update({ id }, medicineData);
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
          expiration_date: entry.expirationDate.toISOString(),
        });
      } else {
        await this.generalProductRepository.save({
          ...product,
          expiration_date: entry.expirationDate.toISOString(),
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
