import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, Like } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import * as bcrypt from 'bcrypt';
import { FindUsersDto } from './dto/find-users.dto';
import { Branch } from 'src/branches/intities/branches.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private readonly commonService: CommonService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // Verificar si el nombre de usuario ya está en uso
      const findUser = await this.findUserByUsernameAndEmail(createUserDto.username, createUserDto.email);
      if (findUser) {
        this.commonService.handleExceptions(
          'El nombre de usuario o email ya está ocupado.',
          'BR',
        );
      }

      // Buscar la sucursal
      const branch = await this.branchRepository.findOne({
        where: { id: createUserDto.branch }
      });

      if (!branch) {
        this.commonService.handleExceptions(
          'La sucursal especificada no existe.',
          'BR',
        );
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        branch: branch
      });

      await this.userRepository.save(user);
      delete user.password;

      const { password, transactions, ...result } = user;

      return result;
    } catch (error) {
      this.commonService.handleExceptions(error, 'BR');
    }
  }

  async findAll(findUsersDto: FindUsersDto) {
    try {
      const { search, page = 1, limit = 5 } = findUsersDto;
      
      const queryBuilder = this.userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.branch', 'branch');
      
      if (search.length > 1) {
        queryBuilder.where('user.name LIKE :search OR user.email LIKE :search OR user.username LIKE :search', 
          { search: `%${search}%` });
        
        const users = await queryBuilder
          .select([
            'user.id', 
            'user.username', 
            'user.email', 
            'user.role', 
            'user.isActive', 
            'user.name', 
            'user.lastLogin',
            'branch.id',
            'branch.name'
          ])
          .getMany();
        
        return {
          data: users,
          meta: {
            total: users.length,
            page: 1,
            limit: users.length,
            totalPages: 1
          }
        };
      }
      
      const skip = (page - 1) * limit;
      
      const [users, total] = await queryBuilder
        .select([
          'user.id', 
          'user.username', 
          'user.email', 
          'user.role', 
          'user.isActive', 
          'user.name', 
          'user.lastLogin',
          'branch.id',
          'branch.name'
        ])
        .skip(skip)
        .take(limit)
        .getManyAndCount();
      
      return {
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.commonService.handleExceptions(error, 'NF');
    }
  }

  async findOne(id: string) {
    const res = await this.userRepository.findOne({
      where: { id },
      relations: ['branch']
    });

    if (!res) {
      this.commonService.handleExceptions('Usuario no encontrado', 'NF');
    }

    return res;
  }

  async findUserByUsernameAndEmail(userName: string, email: string) {
    try {
      return await this.userRepository.findOne({
        where: {
          username: userName,
          email: email,
        },
      });
    } catch (error) {
      this.commonService.handleExceptions(error, 'NF');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findOne(id);
      
      if (updateUserDto.branch) {
        const branch = await this.branchRepository.findOne({
          where: { id: updateUserDto.branch }
        });

        if (!branch) {
          this.commonService.handleExceptions(
            'La sucursal especificada no existe.',
            'BR',
          );
        }

        user.branch = branch;
      }

      // Eliminar la propiedad branch del DTO para evitar conflictos
      const { branch, ...updateData } = updateUserDto;

      // Actualizar el usuario
      await this.userRepository.update(id, {
        ...updateData,
        branch: user.branch
      });

      return {
        message: 'Usuario actualizado correctamente',
      }
    } catch (error) {
      this.commonService.handleExceptions(error, 'BR');
    }
  }

  async disableUserAccount(id: string) {
    try {
      const user = await this.findOne(id);
      await this.userRepository.update(id, { isActive: !user.isActive });
      if (user.isActive) {
        return {
          message: 'Usuario desactivado correctamente',
        }
      } else {
        return {
          message: 'Usuario activado correctamente',
        }
      }
    } catch (error) {
      this.commonService.handleExceptions(error, 'BR');
    }
  } 

  async resetPassword(id: string) {
    try {
      await this.findOne(id);
      const newPassword = Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.update(id, { password: hashedPassword });
      return {
        message: 'Contraseña restablecida correctamente',
        newPassword: newPassword,
      }
    } catch (error) {
      this.commonService.handleExceptions(error, 'BR');
    }
  }

  async isUserActive(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id,
          isActive: true,
        },
      });
      return user ? true : false;
    } catch (error) {
      this.commonService.handleExceptions(error, 'BR');
    }
  }
}
