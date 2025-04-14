import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './intities/branches.entity';
import { User } from 'src/users/entities/user.entity';
import { GeneralProduct } from 'src/products/entities/general-product.entity';
import { Medicine } from 'src/products/entities/medicine.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import { TransactionHistory } from 'src/transaction_history/entities/transaction_history.entity';
import { BaseProduct } from 'src/products/entities/base-product.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Branch,
            User,
            BaseProduct,
            GeneralProduct,
            Medicine,
            Sale,
            TransactionHistory
        ])
    ],
    controllers: [BranchesController],
    providers: [BranchesService],
    exports: [BranchesService]
})
export class BranchesModule {}
