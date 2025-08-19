import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { SalesModule } from './sales/sales.module';
import { SaleDetailModule } from './sale_detail/sale_detail.module';
import { CategoryModule } from './category/category.module';
import { UsersModule } from './users/users.module';
import { TransactionHistoryModule } from './transaction_history/transaction_history.module';
import { LogsModule } from './logs/logs.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { PresentationModule } from './presentation/presentation.module';
import { CashModule } from './cash/cash.module';
import { NotificationsModule } from './notifications/notifications.module';

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
    CategoryModule,
    UsersModule,
    TransactionHistoryModule,
    LogsModule,
    AuthModule,
    BranchesModule,
    PresentationModule,
    CashModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
