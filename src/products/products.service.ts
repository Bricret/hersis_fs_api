import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(Medicine)
    private medicineRepository: Repository<Medicine>,

    @InjectRepository(GeneralProduct)
    private generalProductRepository: Repository<GeneralProduct>,

    private readonly categorieService: CategoryService,
    private readonly commonService: CommonService,
    private readonly logsService: LogsService,
  ) {}

  async create(createProductDto: CreateProductDto | CreateProductDto[]) {
    try {
      if (Array.isArray(createProductDto)) {
        const medicines = createProductDto.filter(
          (dto) => dto.type === 'medicine',
        );

        const uniqueMedicines = medicines.filter(
          (dto, index, self) =>
            index ===
            self.findIndex(
              (t) =>
                (t.barCode && t.barCode === dto.barCode) ||
                (!t.barCode && t.name === dto.name),
            ),
        );

        const results = [];
        for (const dto of uniqueMedicines) {
          const exists = await this.medicineRepository.findOne({
            where: [
              dto.barCode ? { barCode: dto.barCode } : { name: dto.name },
            ],
          });
          if (!exists) {
            const result = await this.create(dto);
            results.push(result);
          }
        }
        return {
          message: 'Medicamentos registrados correctamente.',
          products: results,
        };
      }

      const category = await this.categorieService.findOne(
        createProductDto.category_id,
      );
      if (createProductDto.type === 'medicine') {
        const medicineData = {
          ...createProductDto,
          category,
          presentation_id: createProductDto.presentation_id,
          type: 'medicine' as const,
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
        const generalProduct = this.generalProductRepository.create({
          ...createProductDto,
          type: 'general' as const,
        });
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

  async createBulk(createProductDtos: CreateProductDto[]) {
    try {
      const results = [];
      for (const dto of createProductDtos) {
        const product = await this.create(dto);
        results.push(product);
      }
      return {
        message: 'Productos registrados correctamente.',
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findAll(findProductsDto: FindProductsDto) {
    try {
      const { search, page = 1, limit = 10 } = findProductsDto;

      const medicineQueryBuilder = this.medicineRepository
        .createQueryBuilder('medicine')
        .leftJoinAndSelect('medicine.category', 'category');

      const generalProductQueryBuilder = this.generalProductRepository
        .createQueryBuilder('generalProduct')
        .leftJoinAndSelect('generalProduct.category', 'category');

      if (search && search.length > 0) {
        const searchPattern = `%${search}%`;
        medicineQueryBuilder.where(
          'medicine.name LIKE :search OR medicine.description LIKE :search OR medicine.barCode LIKE :search',
          { search: searchPattern },
        );
        generalProductQueryBuilder.where(
          'generalProduct.name LIKE :search OR generalProduct.description LIKE :search OR generalProduct.barCode LIKE :search',
          { search: searchPattern },
        );
      }

      const skip = (page - 1) * limit;

      const [medicines, totalMedicines] = await medicineQueryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const [generalProducts, totalGeneralProducts] =
        await generalProductQueryBuilder
          .skip(skip)
          .take(limit)
          .getManyAndCount();

      const allProducts = [...medicines, ...generalProducts];
      const total = totalMedicines + totalGeneralProducts;

      return {
        data: allProducts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findOne(id: bigint, type: string) {
    try {
      if (type === 'general') {
        const product = await this.generalProductRepository.findOneBy({ id });
        if (!product) {
          this.commonService.handleExceptions(
            `El producto con ID ${id} no fue encontrado.`,
            'NF',
          );
        }
        return product;
      } else {
        const medicine = await this.medicineRepository.findOneBy({ id });
        if (!medicine) {
          this.commonService.handleExceptions(
            `El medicamento con ID ${id} no fue encontrado.`,
            'NF',
          );
        }
        return medicine;
      }
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async update(id: bigint, updateProductDto: UpdateProductDto) {
    try {
      const medicine = await this.medicineRepository.findOne({ where: { id } });
      if (medicine) {
        const { presentation_id, category_id, ...medicineData } = updateProductDto;
        
        const updateData: any = { ...medicineData };
        
        if (category_id) {
          updateData.category = { id: category_id };
        }
        
        if (presentation_id) {
          updateData.presentation = { id: presentation_id };
        }
        
        await this.medicineRepository.update({ id }, updateData);
        
        await this.logsService.createLog({
          action: 'update',
          entity: 'medicine',
          description: `Medicamento ${medicine.name} actualizado exitosamente.`,
          userId: '1',
          timestamp: new Date(),
        });
        
        return { message: 'Medicamento actualizado correctamente' };
      }

      const generalProduct = await this.generalProductRepository.findOne({
        where: { id },
      });
      if (generalProduct) {
        const { category_id, ...generalProductData } = updateProductDto;
        
        const updateData: any = { ...generalProductData };
        
        if (category_id) {
          updateData.category = { id: category_id };
        }
        
        await this.generalProductRepository.update({ id }, updateData);
        
        await this.logsService.createLog({
          action: 'update',
          entity: 'general_product',
          description: `Producto ${generalProduct.name} actualizado exitosamente.`,
          userId: '1',
          timestamp: new Date(),
        });
        
        return { message: 'Producto actualizado correctamente' };
      }
      
      this.commonService.handleExceptions(
        'El producto solicitado no fue encontrado.',
        'NF',
      );
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async remove(id: bigint, type: string) {
    console.log(id, type);
    try {
      const productFind = await this.findOne(id, type);

      if (type === 'general') {
        await this.generalProductRepository.update(
          { id },
          {
            is_active: !productFind.is_active,
          },
        );
        return { message: "Producto desactivado correctamente" }
      } else {
        await this.medicineRepository.update(
          { id },
          {
            is_active: !productFind.is_active,
          },
        );
        return { message: "Medicamento desactivado correctamente" }
      }
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async addInventoryEntry(entry: {
    productId: bigint;
    quantity: number;
    expirationDate: Date;
    type: string
  }) {
    try {
      const product = await this.findOne(entry.productId, entry.type);
      if (!product) {
        this.commonService.handleExceptions(
          'El producto solicitado no fue encontrado.',
          'NF',
        );
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

  async addBulkInventoryEntries(bulkEntryDto: BulkInventoryEntryDto, type: string) {
    try {
      const results = [];

      for (const entry of bulkEntryDto.entries) {
        const product = await this.findOne(entry.productId, type);
        if (!product) {
          this.commonService.handleExceptions(
            `El producto ${entry.productId} no fue encontrado.`,
            'NF',
          );
        }

        const data = await this.addInventoryEntry({...entry, type});
        results.push(data);
      }

      return {
        message: 'Inventario actualizado correctamente.',
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async refillProduct(
    id: bigint,
    body: {
      refill: number;
      type: string;
    },
  ) {
    const { refill, type } = body;

    try {
      if (type === 'general') {
        const product = await this.generalProductRepository.findOneBy({ id });
        if (!product) {
          this.commonService.handleExceptions(
            `El producto con ID ${id} no fue encontrado.`,
            'NF',
          );
        }

        const newStock = product.initial_quantity + refill;

        await this.generalProductRepository.update(
          { id },
          {
            initial_quantity: newStock,
          },
        );

        return {
          message: `El producto ${product.name} fue recargado correctamente`,
        };
      } else {
        const product = await this.medicineRepository.findOneBy({ id });
        if (!product) {
          this.commonService.handleExceptions(
            `El medicamento con ID ${id} no fue encontrado.`,
            'NF',
          );
        }

        const newStock = product.initial_quantity + refill;

        await this.medicineRepository.update(
          { id },
          {
            initial_quantity: newStock,
          },
        );
        return {
          message: `El medicamento ${product.name} fue recargado correctamente`,
        };
      }
    } catch (error) {
      console.log(error);
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async updatePriceProduct(
    id: bigint,
    body: { type: string; newPrice: number },
  ) {
    const { type, newPrice } = body;

    try {
      if (type === 'general') {
        const product = await this.generalProductRepository.findOneBy({ id });
        if (!product) {
          this.commonService.handleExceptions(
            `El producto con ID ${id} no fue encontrado.`,
            'NF',
          );
        }

        await this.generalProductRepository.update(
          { id },
          {
            sales_price: newPrice,
          },
        );

        return {
          message: `El producto ${product.name} cambio su precio correctamente`,
        };
      } else {
        const product = await this.medicineRepository.findOneBy({ id });
        if (!product) {
          this.commonService.handleExceptions(
            `El medicamento con ID ${id} no fue encontrado.`,
            'NF',
          );
        }

        await this.medicineRepository.update(
          { id },
          {
            sales_price: newPrice,
          },
        );
        return {
          message: `El medicamento ${product.name} cambio su precio correctamente`,
        };
      }
    } catch (error) {
      console.log(error);
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
