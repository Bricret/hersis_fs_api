import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './intities/branches.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { User } from 'src/users/entities/user.entity';
import { GeneralProduct } from 'src/products/entities/general-product.entity';
import { Medicine } from 'src/products/entities/medicine.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import { TransactionHistory } from 'src/transaction_history/entities/transaction_history.entity';

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(GeneralProduct)
        private readonly generalProductRepository: Repository<GeneralProduct>,
        @InjectRepository(Medicine)
        private readonly medicineRepository: Repository<Medicine>,
        @InjectRepository(Sale)
        private readonly saleRepository: Repository<Sale>,
        @InjectRepository(TransactionHistory)
        private readonly transactionRepository: Repository<TransactionHistory>,
    ) {}

    async create(createBranchDto: CreateBranchDto): Promise<Branch> {
        const branch = this.branchRepository.create(createBranchDto);
        return await this.branchRepository.save(branch);
    }

    async findAll(): Promise<Branch[]> {
        return await this.branchRepository.find({
            relations: ['users', 'generalProducts', 'medicines', 'sales', 'transactions'],
        });
    }

    async findOne(id: string): Promise<Branch> {
        const branch = await this.branchRepository.findOne({
            where: { id },
            relations: ['users', 'generalProducts', 'medicines', 'sales', 'transactions'],
        });

        if (!branch) {
            throw new NotFoundException(`Branch with ID ${id} not found`);
        }

        return branch;
    }

    async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
        const branch = await this.findOne(id);
        Object.assign(branch, updateBranchDto);
        return await this.branchRepository.save(branch);
    }

    async remove(id: string): Promise<void> {
        const branch = await this.findOne(id);
        
        // Verificar si hay relaciones antes de eliminar
        const users = await this.userRepository.count({ where: { branch: { id } } });
        const generalProducts = await this.generalProductRepository.count({ where: { branch: { id } } });
        const medicines = await this.medicineRepository.count({ where: { branch: { id } } });
        const sales = await this.saleRepository.count({ where: { branch: { id } } });
        const transactions = await this.transactionRepository.count({ where: { branch: { id } } });

        if (users > 0 || generalProducts > 0 || medicines > 0 || sales > 0 || transactions > 0) {
            throw new NotFoundException(
                'No se puede eliminar la sucursal porque tiene relaciones con usuarios, productos, medicamentos, ventas o transacciones'
            );
        }

        await this.branchRepository.remove(branch);
    }
}
