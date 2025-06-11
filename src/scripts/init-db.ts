import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BranchesService } from '../branches/branches.service';
import { UsersService } from '../users/users.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('InitDB');
  const app = await NestFactory.create(AppModule);

  try {
    const branchesService = app.get(BranchesService);
    const usersService = app.get(UsersService);

    // Crear sucursal por defecto
    logger.log('Creando sucursal por defecto...');
    const branch = await branchesService.create({
      name: 'Sucursal Principal',
      address: 'Dirección Principal',
      phone: '+1234567890'
    });
    logger.log('Sucursal creada exitosamente');

    // Crear usuario administrador
    logger.log('Creando usuario administrador...');
    const adminUser = await usersService.create({
      name: 'Administrador',
      username: 'admin',
      email: 'admin@hersis.com',
      password: '123456',
      role: 'admin',
      branch: branch.id
    });
    logger.log('Usuario administrador creado exitosamente');

    logger.log('Inicialización completada exitosamente');
  } catch (error) {
    logger.error('Error durante la inicialización:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 