import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { SalesModule } from './sales/sales.module';
import { SaleDetailModule } from './sale_detail/sale_detail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ProductsModule,
    CommonModule,
    SalesModule,
    SaleDetailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
