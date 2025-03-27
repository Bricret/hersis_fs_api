import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly commonService: CommonService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // Verificar si el nombre de usuario ya está en uso
      const findUser = await this.findUserByUsername(createUserDto.username);
      if (findUser) {
        this.commonService.handleExceptions(
          'El nombre de usuario ya está ocupado.',
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
      });

      await this.userRepository.save(user);
      delete user.password;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;

      return result;
    } catch (error) {
      this.commonService.handleExceptions(error, 'BR');
    }
  }

  async findAll() {
    try {
      return await this.userRepository.find();
    } catch (error) {
      this.commonService.handleExceptions(error, 'NF');
    }
  }

  async findOne(id: string) {
    return await this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findUserByUsername(userName: string) {
    try {
      return await this.userRepository.findOne({
        where: {
          username: userName,
        },
      });
    } catch (error) {
      this.commonService.handleExceptions(error, 'NF');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.findOne(id);

      await this.userRepository.update(id, updateUserDto);
      return await this.findOne(id);
    } catch (error) {
      this.commonService.handleExceptions(error, 'BR');
    }
  }

  async disableUserAccount(id: string) {
    try {
      await this.findOne(id);

      await this.userRepository.update(id, { isActive: false });
      return await this.findOne(id);
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
