// src/auth/auth.controller.ts
import { Controller, Get, Post, Request, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, LocalAuthGuard } from './guards';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Login con Guard Local
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  // Ejemplo de endpoint protegido
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // Retorna los datos del JWT decodificados
  }

  // Ejemplo de endpoint para admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(UserRole.ADMIN)
  adminDashboard() {
    return { message: 'Panel de administrador' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logOut();
  }
}