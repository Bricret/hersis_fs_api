import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Branch } from 'src/branches/intities/branches.entity';
import { Cash } from 'src/cash/entities/cash.entity';
import { CashStatus } from 'src/cash/entities/cash.entity';
import { SaleDetailService } from 'src/sale_detail/sale_detail.service';
import { SaleDetail } from 'src/sale_detail/entities/sale_detail.entity';
import { User } from 'src/users/entities/user.entity';
import { QueryFindAllDto } from './dto/query-findAll.dto';
import { SearchSalesDto } from './dto/search-sales.dto';
import { GeneralProduct } from 'src/products/entities/general-product.entity';
import { Medicine } from 'src/products/entities/medicine.entity';
import { SalesSchema, PaginatedSalesResponse } from './dto/sales.schema';

@Injectable()
export class SalesService {

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Cash)
    private readonly cashRepository: Repository<Cash>,
    @InjectRepository(SaleDetail)
    private readonly saleDetailRepository: Repository<SaleDetail>,
    private readonly commonService: CommonService,
    private readonly saleDetailService: SaleDetailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createSaleDto: CreateSaleDto) {
    try {
      const { branch_id, saleDetails, user_id, ...saleData } = createSaleDto;

      // Verificar que la sucursal existe
      const branch = await this.branchRepository.findOne({
        where: { id: branch_id },
      });
      if (!branch) {
        throw new BadRequestException('Sucursal no encontrada');
      }

      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Buscar la caja abierta en la sucursal
      const activeCash = await this.cashRepository.findOne({
        where: {
          branch: { id: branch_id },
          estado: CashStatus.ABIERTA,
        },
      });

      if (!activeCash) {
        throw new BadRequestException('No hay una caja abierta en esta sucursal. Debe abrir una caja antes de realizar ventas.');
      }

      // Validar que hay detalles de venta
      if (!saleDetails || saleDetails.length === 0) {
        throw new BadRequestException('Debe incluir al menos un producto en la venta');
      }

      // Verificar stock antes de procesar la venta
      await this.validateStock(saleDetails);

      // Calcular el total de la venta
      const total = saleDetails.reduce((sum, detail) => {
        return sum + (detail.quantity * detail.unit_price);
      }, 0);

      // Crear la venta
      const sale = this.saleRepository.create({
        ...saleData,
        total,
        date: new Date(),
        branch,
        cash_register: activeCash,
        user: user,
      });

      const savedSale = await this.saleRepository.save(sale);

      // Crear los detalles de venta
      const createdDetails = [];
      for (const detail of saleDetails) {
        const saleDetail = await this.saleDetailService.create(detail, savedSale);
        createdDetails.push(saleDetail);
      }

      // Actualizar los totales de la caja
      await this.updateCashTotals(activeCash.id, total);

      // Retornar la venta completa con sus detalles
      return {
        ...savedSale,
        saleDetails: createdDetails,
        message: 'Venta registrada exitosamente'
      };

    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findAll(query: QueryFindAllDto): Promise<PaginatedSalesResponse> {
    try {
      const { page = 1, limit = 10 } = query;
      
      // Validar parámetros de paginación
      const validPage = Math.max(1, page);
      const validLimit = Math.min(100, Math.max(1, limit)); // Máximo 100 por página
      const skip = (validPage - 1) * validLimit;

      // Obtener el total de ventas para la paginación
      const total = await this.saleRepository.count();

      // Obtener las ventas con paginación usando QueryBuilder para mejor control de relaciones
      const sales = await this.saleRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect('sale.branch', 'branch')
        .leftJoinAndSelect('sale.cash_register', 'cash_register')
        .leftJoinAndSelect('sale.saleDetails', 'saleDetails')
        .leftJoinAndSelect('sale.user', 'user')
        .orderBy('sale.date', 'DESC')
        .skip(skip)
        .take(validLimit)
        .getMany();

      // Verificar y recargar relaciones faltantes
      let reloadedCount = 0;
      for (let i = 0; i < sales.length; i++) {
        const sale = sales[i];
        if (!sale.user) {
          console.log(`Recargando venta ${i} (ID: ${sale.id}) - usuario faltante`);
          const reloadedSale = await this.saleRepository.findOne({
            where: { id: sale.id },
            relations: ['branch', 'cash_register', 'saleDetails', 'user']
          });
          if (reloadedSale) {
            sales[i] = reloadedSale;
            reloadedCount++;
          }
        }
      }
      console.log(`Total de ventas recargadas: ${reloadedCount}`);

      // Verificar estado final de las relaciones
      const finalRelationsCheck = sales.map((sale, index) => ({
        index,
        id: sale.id,
        hasBranch: !!sale.branch,
        hasUser: !!sale.user,
        hasCashRegister: !!sale.cash_register,
        hasSaleDetails: !!sale.saleDetails
      }));
      console.log('Estado final de relaciones:', finalRelationsCheck);

      // Cargar los productos de forma separada para evitar problemas de JOIN
      for (const sale of sales) {
        if (sale.saleDetails) {
          for (const detail of sale.saleDetails) {
            if (detail.product_type === 'general' && detail.productId) {
              try {
                const product = await this.saleRepository.manager.findOne(GeneralProduct, {
                  where: { id: BigInt(detail.productId) }
                });
                if (product) {
                  detail['productName'] = product.name;
                }
              } catch (error) {
                // Si no se puede cargar el producto, continuar
                detail['productName'] = 'Producto no encontrado';
              }
            } else if (detail.product_type === 'medicine' && detail.productId) {
              try {
                const medicine = await this.saleRepository.manager.findOne(Medicine, {
                  where: { id: BigInt(detail.productId) }
                });
                if (medicine) {
                  detail['productName'] = medicine.name;
                }
              } catch (error) {
                // Si no se puede cargar el medicamento, continuar
                detail['productName'] = 'Medicamento no encontrado';
              }
            }
          }
        }
      }

      // Log para debugging
      console.log('=== SALES PAGINATION DEBUG ===');
      console.log('Total count:', total);
      console.log('Page:', validPage, 'Limit:', validLimit, 'Skip:', skip);
      console.log('Sales found:', sales.length);
      console.log('Expected range:', skip + 1, 'to', skip + validLimit);
      
      // Verificar relaciones cargadas
      if (sales.length > 0) {
        console.log('First sale relations check:', {
          hasBranch: !!sales[0].branch,
          hasUser: !!sales[0].user,
          hasCashRegister: !!sales[0].cash_register,
          hasSaleDetails: !!sales[0].saleDetails
        });
      }
      console.log('===============================');
      
      sales.forEach((sale, index) => {
        if (!sale.branch || !sale.user) {
          console.log(`Venta ${index} (ID: ${sale.id}) tiene relaciones faltantes:`, {
            hasBranch: !!sale.branch,
            hasUser: !!sale.user,
            hasCashRegister: !!sale.cash_register,
            hasSaleDetails: !!sale.saleDetails
          });
        }
      });

      // Mapear los resultados según el esquema SalesSchema
      const mappedSales: SalesSchema[] = sales
        .filter(sale => sale.branch && sale.user) // Filtrar ventas sin branch o user
        .map(sale => ({
          id: Number(sale.id),
          date: sale.date,
          total: sale.total,
          branch: sale.branch ? {
            id: sale.branch.id,
            name: sale.branch.name
          } : null,
          cash_register: sale.cash_register ? {
            id: sale.cash_register.id,
            fecha_apertura: sale.cash_register.fecha_apertura,
            fecha_cierre: sale.cash_register.fecha_cierre,
            estado: sale.cash_register.estado
          } : null,
          user: sale.user ? {
            id: sale.user.id,
            name: sale.user.name,
            is_active: sale.user.isActive
          } : null,
          saleDetails: sale.saleDetails ? sale.saleDetails.map(detail => ({
            id: detail.id.toString(),
            quantity: detail.quantity,
            unit_price: detail.unit_price,
            subtotal: detail.subtotal,
            productId: detail.productId,
            product_type: detail.product_type,
            productName: detail['productName'] || 'Producto no encontrado'
          })) : []
        }))
        .filter(sale => sale.branch && sale.user); // Filtrar ventas mapeadas sin branch o user

      // Calcular metadata de paginación
      const totalPages = Math.ceil(total / validLimit);
      const hasNextPage = validPage < totalPages;
      const hasPreviousPage = validPage > 1;

      // Retornar respuesta paginada
      return {
        data: mappedSales,
        metadata: {
          total,
          page: validPage,
          limit: validLimit,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async searchSales(searchDto: SearchSalesDto): Promise<PaginatedSalesResponse> {
    try {
      const { search, page = 1, limit = 10 } = searchDto;
      
      // Validar parámetros de paginación
      const validPage = Math.max(1, page);
      const validLimit = Math.min(100, Math.max(1, limit)); // Máximo 100 por página
      const skip = (validPage - 1) * validLimit;

      // Construir la consulta de búsqueda
      let whereCondition: any = {};
      
      // Verificar si la búsqueda es un número (ID de venta)
      const isNumericSearch = !isNaN(Number(search));
      
      if (isNumericSearch) {
        // Buscar por ID de venta
        whereCondition = { id: BigInt(search) };
      } else {
        // Buscar por nombre de vendedor (búsqueda parcial)
        whereCondition = { user: { name: Like(`%${search}%`) } };
      }

      // Obtener el total de resultados de búsqueda
      const total = await this.saleRepository.count({
        where: whereCondition,
        relations: isNumericSearch ? [] : ['user']
      });

      // Obtener las ventas con paginación usando QueryBuilder para mejor control de relaciones
      const queryBuilder = this.saleRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect('sale.branch', 'branch')
        .leftJoinAndSelect('sale.cash_register', 'cash_register')
        .leftJoinAndSelect('sale.saleDetails', 'saleDetails')
        .leftJoinAndSelect('sale.user', 'user')
        .orderBy('sale.date', 'DESC')
        .skip(skip)
        .take(validLimit);

      // Aplicar condiciones de búsqueda
      if (isNumericSearch) {
        queryBuilder.where('sale.id = :id', { id: search });
      } else {
        queryBuilder.where('user.name LIKE :name', { name: `%${search}%` });
      }

      const sales = await queryBuilder.getMany();

      // Verificar y recargar relaciones faltantes
      let reloadedCount = 0;
      for (let i = 0; i < sales.length; i++) {
        const sale = sales[i];
        if (!sale.user) {
          console.log(`Recargando venta de búsqueda ${i} (ID: ${sale.id}) - usuario faltante`);
          const reloadedSale = await this.saleRepository.findOne({
            where: { id: sale.id },
            relations: ['branch', 'cash_register', 'saleDetails', 'user']
          });
          if (reloadedSale) {
            sales[i] = reloadedSale;
            reloadedCount++;
          }
        }
      }
      console.log(`Total de ventas recargadas: ${reloadedCount}`);

      // Verificar estado final de las relaciones
      const finalRelationsCheck = sales.map((sale, index) => ({
        index,
        id: sale.id,
        hasBranch: !!sale.branch,
        hasUser: !!sale.user,
        hasCashRegister: !!sale.cash_register,
        hasSaleDetails: !!sale.saleDetails
      }));
      console.log('Estado final de relaciones:', finalRelationsCheck);

      // Cargar los productos de forma separada para evitar problemas de JOIN
      for (const sale of sales) {
        if (sale.saleDetails) {
          for (const detail of sale.saleDetails) {
            if (detail.product_type === 'general' && detail.productId) {
              try {
                const product = await this.saleRepository.manager.findOne(GeneralProduct, {
                  where: { id: BigInt(detail.productId) }
                });
                if (product) {
                  detail['productName'] = product.name;
                }
              } catch (error) {
                detail['productName'] = 'Producto no encontrado';
              }
            } else if (detail.product_type === 'medicine' && detail.productId) {
              try {
                const medicine = await this.saleRepository.manager.findOne(Medicine, {
                  where: { id: BigInt(detail.productId) }
                });
                if (medicine) {
                  detail['productName'] = medicine.name;
                }
              } catch (error) {
                detail['productName'] = 'Medicamento no encontrado';
              }
            }
          }
        }
      }

      // Log para debugging
      console.log('=== SALES SEARCH DEBUG ===');
      console.log('Search term:', search);
      console.log('Is numeric search:', isNumericSearch);
      console.log('Total count:', total);
      console.log('Page:', validPage, 'Limit:', validLimit, 'Skip:', skip);
      console.log('Sales found:', sales.length);
      
      // Verificar relaciones cargadas
      if (sales.length > 0) {
        console.log('First sale relations check:', {
          hasBranch: !!sales[0].branch,
          hasUser: !!sales[0].user,
          hasCashRegister: !!sales[0].cash_register,
          hasSaleDetails: !!sales[0].saleDetails
        });
      }
      console.log('==========================');

      // Mapear los resultados según el esquema SalesSchema
      const mappedSales: SalesSchema[] = sales
        .filter(sale => sale.branch && sale.user)
        .map(sale => ({
          id: Number(sale.id),
          date: sale.date,
          total: sale.total,
          branch: sale.branch ? {
            id: sale.branch.id,
            name: sale.branch.name
          } : null,
          cash_register: sale.cash_register ? {
            id: sale.cash_register.id,
            fecha_apertura: sale.cash_register.fecha_apertura,
            fecha_cierre: sale.cash_register.fecha_cierre,
            estado: sale.cash_register.estado
          } : null,
          user: sale.user ? {
            id: sale.user.id,
            name: sale.user.name,
            is_active: sale.user.isActive
          } : null,
          saleDetails: sale.saleDetails ? sale.saleDetails.map(detail => ({
            id: detail.id.toString(),
            quantity: detail.quantity,
            unit_price: detail.unit_price,
            subtotal: detail.subtotal,
            productId: detail.productId,
            product_type: detail.product_type,
            productName: detail['productName'] || 'Producto no encontrado'
          })) : []
        }));

      // Calcular metadata de paginación
      const totalPages = Math.ceil(total / validLimit);
      const hasNextPage = validPage < totalPages;
      const hasPreviousPage = validPage > 1;

      // Retornar respuesta paginada
      return {
        data: mappedSales,
        metadata: {
          total,
          page: validPage,
          limit: validLimit,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findOne(id: number) {
    try {
      const sale = await this.saleRepository.findOne({
        where: { id: BigInt(id) },
        relations: ['branch', 'cash_register', 'saleDetails'],
      });

      if (!sale) {
        throw new BadRequestException(`Venta con ID ${id} no encontrada`);
      }

      return sale;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'NF');
    }
  }

  async findByCash(cashId: string) {
    try {
      return await this.saleRepository.find({
        where: { cash_register: { id: cashId } },
        relations: ['branch', 'cash_register', 'saleDetails'],
        order: { date: 'DESC' },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findByBranch(branchId: string) {
    try {
      return await this.saleRepository.find({
        where: { branch: { id: branchId } },
        relations: ['branch', 'cash_register', 'saleDetails'],
        order: { date: 'DESC' },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findByDateRange(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const whereCondition: any = {
        date: Between(startDate, endDate),
      };

      if (branchId) {
        whereCondition.branch = { id: branchId };
      }

      return await this.saleRepository.find({
        where: whereCondition,
        relations: ['branch', 'cash_register', 'saleDetails'],
        order: { date: 'DESC' },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async getSalesSummaryByCash(cashId: string) {
    try {
      const sales = await this.findByCash(cashId);
      const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalItems = sales.reduce((sum, sale) => {
        return sum + sale.saleDetails.reduce((detailSum, detail) => detailSum + detail.quantity, 0);
      }, 0);
      
      return {
        cash_id: cashId,
        total_sales_count: sales.length,
        total_amount: totalAmount,
        total_items_sold: totalItems,
        average_sale: sales.length > 0 ? totalAmount / sales.length : 0,
        sales: sales,
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async getSalesSummaryByBranch(branchId: string) {
    try {
      const sales = await this.findByBranch(branchId);
      const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalItems = sales.reduce((sum, sale) => {
        return sum + sale.saleDetails.reduce((detailSum, detail) => detailSum + detail.quantity, 0);
      }, 0);
      
      return {
        branch_id: branchId,
        total_sales_count: sales.length,
        total_amount: totalAmount,
        total_items_sold: totalItems,
        average_sale: sales.length > 0 ? totalAmount / sales.length : 0,
        sales: sales,
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async generateReport(createReportDto: CreateReportDto) {
    try {
      const { date_from, date_to, user_id } = createReportDto;

      // Obtener todas las ventas en el rango de fechas
      const sales = await this.findByDateRange(date_from, date_to);

      // Calcular estadísticas generales
      const totalSales = sales.length;
      const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalItems = sales.reduce((sum, sale) => {
        return sum + sale.saleDetails.reduce((detailSum, detail) => detailSum + detail.quantity, 0);
      }, 0);

      // Agrupar por sucursal
      const salesByBranch = sales.reduce((acc, sale) => {
        const branchId = sale.branch.id;
        if (!acc[branchId]) {
          acc[branchId] = {
            branch_name: sale.branch.name,
            sales_count: 0,
            total_amount: 0,
            sales: []
          };
        }
        acc[branchId].sales_count++;
        acc[branchId].total_amount += Number(sale.total);
        acc[branchId].sales.push(sale);
        return acc;
      }, {});

      // Productos más vendidos
      const productSales = {};
      sales.forEach(sale => {
        sale.saleDetails.forEach(detail => {
          const productId = detail.productId;
          if (!productSales[productId]) {
            productSales[productId] = {
              product_id: productId,
              total_quantity: 0,
              total_revenue: 0,
              sales_count: 0
            };
          }
          productSales[productId].total_quantity += detail.quantity;
          productSales[productId].total_revenue += detail.subtotal;
          productSales[productId].sales_count++;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
        .slice(0, 10);

      return {
        report_period: {
          from: date_from,
          to: date_to,
          generated_by: user_id,
          generated_at: new Date()
        },
        summary: {
          total_sales: totalSales,
          total_amount: totalAmount,
          total_items_sold: totalItems,
          average_sale: totalSales > 0 ? totalAmount / totalSales : 0
        },
        sales_by_branch: salesByBranch,
        top_products: topProducts,
        daily_sales: this.groupSalesByDay(sales),
        detailed_sales: sales
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async cancelSale(saleId: number, reason: string) {
    try {
      const sale = await this.findOne(saleId);
      
      if (!sale) {
        throw new BadRequestException('Venta no encontrada');
      }

      // Restaurar inventario
      for (const detail of sale.saleDetails) {
        await this.restoreInventory(detail.productId, detail.quantity, detail.product_type);
      }

      // Actualizar totales de caja
      await this.updateCashTotals(sale.cash_register.id, -sale.total);

      // Marcar como cancelada (o eliminar según requerimiento)
      await this.saleRepository.remove(sale);

      return {
        message: 'Venta cancelada exitosamente',
        reason,
        cancelled_at: new Date()
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  private async validateStock(saleDetails: any[]) {
    for (const detail of saleDetails) {
      const product = await this.saleDetailService.getProductDetails(
        detail.productId, 
        detail.product_type
      );
      
      if (product.initial_quantity < detail.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.initial_quantity}, Solicitado: ${detail.quantity}`
        );
      }
    }
  }

  private async updateCashTotals(cashId: string, amount: number) {
    try {
      const cash = await this.cashRepository.findOne({ where: { id: cashId } });
      if (cash) {
        // Actualizar las ventas totales
        const newVentasTotales = Number(cash.ventas_totales) + amount;
        
        // El monto esperado debe ser monto inicial + todas las ventas
        const newMontoEsperado = Number(cash.monto_inicial) + newVentasTotales;
        
        // Actualizar usando el repositorio para evitar problemas de concurrencia
        await this.cashRepository.update(
          { id: cashId },
          {
            ventas_totales: newVentasTotales,
            monto_esperado: newMontoEsperado
          }
        );
      }
    } catch (error) {
      throw new BadRequestException(`Error al actualizar totales de caja: ${error.message}`);
    }
  }

  private async restoreInventory(productId: number, quantity: number, productType?: 'medicine' | 'general') {
    try {
      // Si tenemos el tipo de producto lo usamos, sino necesitaríamos determinarlo
      if (productType) {
        if (productType === 'general') {
          const generalProductRepository = this.saleDetailRepository.manager.getRepository('GeneralProduct');
          await generalProductRepository.increment(
            { id: BigInt(productId) },
            'initial_quantity',
            quantity
          );
        } else {
          const medicineRepository = this.saleDetailRepository.manager.getRepository('Medicine');
          await medicineRepository.increment(
            { id: BigInt(productId) },
            'initial_quantity',
            quantity
          );
        }
      }
      console.log(`Restaurado ${quantity} unidades del producto ${productId}`);
    } catch (error) {
      throw new BadRequestException(`Error al restaurar inventario: ${error.message}`);
    }
  }

  private groupSalesByDay(sales: Sale[]) {
    const dailySales = {};
    
    sales.forEach(sale => {
      const dateKey = sale.date.toISOString().split('T')[0];
      if (!dailySales[dateKey]) {
        dailySales[dateKey] = {
          date: dateKey,
          sales_count: 0,
          total_amount: 0
        };
      }
      dailySales[dateKey].sales_count++;
      dailySales[dateKey].total_amount += Number(sale.total);
    });

    return Object.values(dailySales).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async verifyCashConsistency(cashId: string) {
    try {
      const cash = await this.cashRepository.findOne({ where: { id: cashId } });
      if (!cash) {
        throw new BadRequestException('Caja no encontrada');
      }

      // Calcular totales reales desde las ventas
      const actualTotalSales = await this.calculateActualSales(cashId);
      const expectedMontoEsperado = Number(cash.monto_inicial) + actualTotalSales;
      
      return {
        cash_id: cashId,
        monto_inicial: Number(cash.monto_inicial),
        ventas_totales_registradas: Number(cash.ventas_totales),
        ventas_totales_calculadas: actualTotalSales,
        monto_esperado_registrado: Number(cash.monto_esperado),
        monto_esperado_calculado: expectedMontoEsperado,
        es_consistente: Math.abs(Number(cash.ventas_totales) - actualTotalSales) < 0.01 &&
                       Math.abs(Number(cash.monto_esperado) - expectedMontoEsperado) < 0.01
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  private async calculateActualSales(cashId: string): Promise<number> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.cash_register = :cashId', { cashId })
      .getRawOne();

    return Number(result.total) || 0;
  }
}
