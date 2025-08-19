import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';
import { Medicine } from '../products/entities/medicine.entity';
import { GeneralProduct } from '../products/entities/general-product.entity';

@Injectable()
export class ProductMonitoringService {
  // Configuración por defecto para alertas
  private readonly DEFAULT_LOW_STOCK_THRESHOLD = 10;
  private readonly DEFAULT_EXPIRATION_WARNING_DAYS = 30;

  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(GeneralProduct)
    private readonly generalProductRepository: Repository<GeneralProduct>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Verificar productos con bajo stock
   * Se ejecuta todos los días a las 8:00 AM
   */
  @Cron('0 8 * * *')
  async checkLowStockProducts(): Promise<void> {
    try {
      console.log('Iniciando verificación de productos con bajo stock...');

      // Verificar medicamentos
      await this.checkLowStockMedicines();
      
      // Verificar productos generales
      await this.checkLowStockGeneralProducts();

      console.log('Verificación de bajo stock completada');
    } catch (error) {
      console.error('Error en verificación de bajo stock:', error);
    }
  }

  /**
   * Verificar productos próximos a vencer
   * Se ejecuta todos los días a las 9:00 AM
   */
  @Cron('0 9 * * *')
  async checkExpiringProducts(): Promise<void> {
    try {
      console.log('Iniciando verificación de productos próximos a vencer...');

      // Verificar medicamentos
      await this.checkExpiringMedicines();
      
      // Verificar productos generales
      await this.checkExpiringGeneralProducts();

      console.log('Verificación de productos próximos a vencer completada');
    } catch (error) {
      console.error('Error en verificación de productos próximos a vencer:', error);
    }
  }

  /**
   * Verificar medicamentos con bajo stock
   */
  private async checkLowStockMedicines(): Promise<void> {
    const lowStockMedicines = await this.medicineRepository.find({
      where: {
        initial_quantity: LessThanOrEqual(this.DEFAULT_LOW_STOCK_THRESHOLD),
        is_active: true,
      },
      relations: ['category', 'branch'],
    });

    for (const medicine of lowStockMedicines) {
      // Verificar si ya existe una notificación similar activa
      const existsNotification = await this.notificationsService.existsSimilarNotification(
        NotificationType.LOW_STOCK,
        medicine.id.toString(),
        'product',
      );

      if (!existsNotification) {
        await this.notificationsService.createLowStockNotification(
          medicine.id.toString(),
          medicine.name,
          medicine.initial_quantity,
          this.DEFAULT_LOW_STOCK_THRESHOLD,
          medicine.branch?.id?.toString(),
        );
        
        console.log(`Notificación de bajo stock creada para medicina: ${medicine.name}`);
      }
    }
  }

  /**
   * Verificar productos generales con bajo stock
   */
  private async checkLowStockGeneralProducts(): Promise<void> {
    const lowStockProducts = await this.generalProductRepository.find({
      where: {
        initial_quantity: LessThanOrEqual(this.DEFAULT_LOW_STOCK_THRESHOLD),
        is_active: true,
      },
      relations: ['category', 'branch'],
    });

    for (const product of lowStockProducts) {
      // Verificar si ya existe una notificación similar activa
      const existsNotification = await this.notificationsService.existsSimilarNotification(
        NotificationType.LOW_STOCK,
        product.id.toString(),
        'product',
      );

      if (!existsNotification) {
        await this.notificationsService.createLowStockNotification(
          product.id.toString(),
          product.name,
          product.initial_quantity,
          this.DEFAULT_LOW_STOCK_THRESHOLD,
          product.branch?.id?.toString(),
        );
        
        console.log(`Notificación de bajo stock creada para producto: ${product.name}`);
      }
    }
  }

  /**
   * Verificar medicamentos próximos a vencer
   */
  private async checkExpiringMedicines(): Promise<void> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + this.DEFAULT_EXPIRATION_WARNING_DAYS);

    const expiringMedicines = await this.medicineRepository.find({
      where: {
        expiration_date: LessThanOrEqual(warningDate),
        is_active: true,
      },
      relations: ['category', 'branch'],
    });

    for (const medicine of expiringMedicines) {
      const daysUntilExpiration = this.calculateDaysUntilExpiration(medicine.expiration_date);
      
      // Verificar si ya existe una notificación similar activa
      const existsNotification = await this.notificationsService.existsSimilarNotification(
        NotificationType.EXPIRATION_WARNING,
        medicine.id.toString(),
        'product',
      );

      if (!existsNotification) {
        await this.notificationsService.createExpirationWarningNotification(
          medicine.id.toString(),
          medicine.name,
          medicine.expiration_date,
          daysUntilExpiration,
          medicine.branch?.id?.toString(),
        );
        
        console.log(`Notificación de vencimiento creada para medicina: ${medicine.name}`);
      }
    }
  }

  /**
   * Verificar productos generales próximos a vencer
   */
  private async checkExpiringGeneralProducts(): Promise<void> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + this.DEFAULT_EXPIRATION_WARNING_DAYS);

    const expiringProducts = await this.generalProductRepository.find({
      where: {
        expiration_date: LessThanOrEqual(warningDate),
        is_active: true,
      },
      relations: ['category', 'branch'],
    });

    for (const product of expiringProducts) {
      const daysUntilExpiration = this.calculateDaysUntilExpiration(product.expiration_date);
      
      // Verificar si ya existe una notificación similar activa
      const existsNotification = await this.notificationsService.existsSimilarNotification(
        NotificationType.EXPIRATION_WARNING,
        product.id.toString(),
        'product',
      );

      if (!existsNotification) {
        await this.notificationsService.createExpirationWarningNotification(
          product.id.toString(),
          product.name,
          product.expiration_date,
          daysUntilExpiration,
          product.branch?.id?.toString(),
        );
        
        console.log(`Notificación de vencimiento creada para producto: ${product.name}`);
      }
    }
  }

  /**
   * Calcular días hasta el vencimiento
   */
  private calculateDaysUntilExpiration(expirationDate: Date): number {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Verificar un producto específico manualmente
   */
  async checkSpecificProduct(productId: string, productType: 'medicine' | 'general'): Promise<void> {
    try {
      let product;
      
      if (productType === 'medicine') {
        product = await this.medicineRepository.findOne({
          where: { id: BigInt(productId), is_active: true },
          relations: ['category', 'branch'],
        });
      } else {
        product = await this.generalProductRepository.findOne({
          where: { id: BigInt(productId), is_active: true },
          relations: ['category', 'branch'],
        });
      }

      if (!product) {
        console.log(`Producto ${productId} no encontrado o inactivo`);
        return;
      }

      // Verificar bajo stock
      if (product.initial_quantity <= this.DEFAULT_LOW_STOCK_THRESHOLD) {
        const existsStockNotification = await this.notificationsService.existsSimilarNotification(
          NotificationType.LOW_STOCK,
          productId,
          'product',
        );

        if (!existsStockNotification) {
          await this.notificationsService.createLowStockNotification(
            productId,
            product.name,
            product.initial_quantity,
            this.DEFAULT_LOW_STOCK_THRESHOLD,
            product.branch?.id?.toString(),
          );
        }
      }

      // Verificar vencimiento
      const daysUntilExpiration = this.calculateDaysUntilExpiration(product.expiration_date);
      
      if (daysUntilExpiration <= this.DEFAULT_EXPIRATION_WARNING_DAYS) {
        const existsExpirationNotification = await this.notificationsService.existsSimilarNotification(
          NotificationType.EXPIRATION_WARNING,
          productId,
          'product',
        );

        if (!existsExpirationNotification) {
          await this.notificationsService.createExpirationWarningNotification(
            productId,
            product.name,
            product.expiration_date,
            daysUntilExpiration,
            product.branch?.id?.toString(),
          );
        }
      }

      console.log(`Verificación manual completada para producto: ${product.name}`);
    } catch (error) {
      console.error(`Error verificando producto ${productId}:`, error);
    }
  }

  /**
   * Configurar umbrales personalizados (futuro)
   */
  async updateThresholds(lowStockThreshold?: number, expirationWarningDays?: number): Promise<void> {
    // Esta funcionalidad se puede implementar más adelante para permitir
    // configuraciones personalizadas por sucursal o globalmente
    console.log('Configuración de umbrales personalizados - Funcionalidad futura');
  }
}
