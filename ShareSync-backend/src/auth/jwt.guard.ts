// in src/auth/jwt.guard.ts (optional diagnostic)
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    // console.log('Auth header:', req.headers.authorization); // TEMP LOG
    return super.canActivate(context);
  }
}