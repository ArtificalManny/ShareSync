import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async canActivate(context): Promise<boolean> {
    const can = await super.canActivate(context);
    if (!can) {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
}