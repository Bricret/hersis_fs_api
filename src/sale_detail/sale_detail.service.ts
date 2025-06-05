import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSaleDetailDto } from './dto/create-sale_detail.dto';
import { UpdateSaleDetailDto } from './dto/update-sale_detail.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleDetail } from './entities/sale_detail.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import { GeneralProduct } from 'src/products/entities/general-product.entity';
import { Medicine } from 'src/products/entities/medicine.entity';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class SaleDetailService {

  constructor(
    @InjectRepository(SaleDetail)
    private readonly saleDetailRepository: Repository<SaleDetail>,
    @InjectRepository(GeneralProduct)
    private readonly generalProductRepository: Repository<GeneralProduct>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    private readonly commonService: CommonService
  ) {}

  async create(createSaleDetailDto: CreateSaleDetailDto, sale: Sale) {
    try {
      const { productId, quantity, unit_price, product_type } = createSaleDetailDto;

      // Verificar que el producto existe
      let product: GeneralProduct | Medicine;
      if (product_type === 'general') {
        product = await this.generalProductRepository.findOne({
          where: { id: BigInt(productId) }
        });
      } else {
        product = await this.medicineRepository.findOne({
          where: { id: BigInt(productId) }
        });
      }

      if (!product) {
        throw new BadRequestException(`Producto con ID ${productId} no encontrado`);
      }

      // Verificar que hay suficiente stock
      if (product.initial_quantity < quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.initial_quantity}, Solicitado: ${quantity}`
        );
      }

      // Calcular subtotal
      const subtotal = quantity * unit_price;

      // Crear el detalle de venta
      const saleDetail = this.saleDetailRepository.create({
        quantity,
        unit_price,
        subtotal,
        productId,
        product_type,
        sale
      });

      await this.saleDetailRepository.save(saleDetail);

      // Reducir el inventario
      await this.reduceInventory(productId, quantity, product_type);

      return saleDetail;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findAll() {
    try {
      return await this.saleDetailRepository.find({
        relations: ['sale'],
        order: { id: 'DESC' }
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findOne(id: number) {
    try {
      const saleDetail = await this.saleDetailRepository.findOne({
        where: { id: BigInt(id) },
        relations: ['sale']
      });

      if (!saleDetail) {
        throw new BadRequestException(`Detalle de venta con ID ${id} no encontrado`);
      }

      return saleDetail;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'NF');
    }
  }

  async findBySale(saleId: number) {
    try {
      return await this.saleDetailRepository.find({
        where: { sale: { id: BigInt(saleId) } },
        order: { id: 'ASC' }
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async update(id: number, updateSaleDetailDto: UpdateSaleDetailDto) {
    try {
      const saleDetail = await this.findOne(id);
      
      if (updateSaleDetailDto.quantity && updateSaleDetailDto.unit_price) {
        updateSaleDetailDto.subtotal = updateSaleDetailDto.quantity * updateSaleDetailDto.unit_price;
      }

      await this.saleDetailRepository.update({ id: BigInt(id) }, updateSaleDetailDto);
      return this.findOne(id);
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async remove(id: number) {
    try {
      const saleDetail = await this.findOne(id);
      await this.saleDetailRepository.remove(saleDetail);
      
      return { message: `Detalle de venta con ID ${id} eliminado correctamente` };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  private async reduceInventory(productId: number, quantity: number, productType: 'medicine' | 'general') {
    try {
      if (productType === 'general') {
        await this.generalProductRepository.decrement(
          { id: BigInt(productId) },
          'initial_quantity',
          quantity
        );
      } else {
        await this.medicineRepository.decrement(
          { id: BigInt(productId) },
          'initial_quantity',
          quantity
        );
      }
    } catch (error) {
      throw new BadRequestException(`Error al reducir inventario: ${error.message}`);
    }
  }

  async getProductDetails(productId: number, productType: 'medicine' | 'general') {
    try {
      let product: GeneralProduct | Medicine;
      
      if (productType === 'general') {
        product = await this.generalProductRepository.findOne({
          where: { id: BigInt(productId) },
          relations: ['category']
        });
      } else {
        product = await this.medicineRepository.findOne({
          where: { id: BigInt(productId) },
          relations: ['category', 'presentation']
        });
      }

      if (!product) {
        throw new BadRequestException(`Producto con ID ${productId} no encontrado`);
      }

      return product;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }
}
