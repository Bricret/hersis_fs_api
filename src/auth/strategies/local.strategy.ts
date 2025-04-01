// src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    // Usa el AuthService para validar credenciales
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user; // Se adjunta al request como req.user
  }
}
