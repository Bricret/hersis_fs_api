// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { CommonService } from '../common/common.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly commonService: CommonService
  ) {}

  // Método para validar usuario durante el login
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'email', 'password', 'role', 'isActive', 'name'], // Selecciona campos necesarios incluyendo password
    });

    if (!user) this.commonService.handleExceptions('Credenciales inválidas', 'BR');
    
    // Verifica si el usuario está activo
    if (!user.isActive) this.commonService.handleExceptions('Cuenta desactivada', 'BR')

    // Compara contraseñas hasheadas
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
        this.commonService.handleExceptions('Credenciales inválidas', 'BR');
    }

    // Excluye el password antes de retornar
    const { password: _, ...safeUser } = user;
    await this.usersRepository.update(user.id, { lastLogin: new Date() });
    return safeUser as User;
  }
  // Método para generar el JWT
  async login(user: User) {
    console.log(user);
    
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      isActive: user.isActive,
      name: user.name
    }
    return {
      data: payload,
      accessToken: this.jwtService.sign(payload)
    }
  }

  async logOut() {


  }
}