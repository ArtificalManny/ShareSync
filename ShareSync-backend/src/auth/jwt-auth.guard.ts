import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context): Promise<boolean> {
    try {
      const can = await super.canActivate(context);
      if (!can) {
        console.log('JwtAuthGuard: Token validation failed');
        throw new UnauthorizedException('Invalid token');
      }
      return true;
    } catch (error) {
      console.log('JwtAuthGuard Error:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }
}