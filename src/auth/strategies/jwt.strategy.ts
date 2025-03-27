// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PayloadJWT, UserAuth } from '../dto/payloadJWT.dto';
import { UsersService } from 'src/users/users.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly commonService: CommonService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: PayloadJWT): Promise<UserAuth> {

    try {
        const user = await this.usersService.isUserActive(payload.id);
        if (!user) this.commonService.handleExceptions('Cuenta desactivada', 'BR')
    } catch (error) {
        this.commonService.handleExceptions(error, 'BR');
    }

    if (!payload.isActive) {
      throw this.commonService.handleExceptions('Cuenta desactivada', 'BR')
    }
    
    return { 
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      username: payload.username,
      isActive: payload.isActive,

    };
  }
}