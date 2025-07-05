// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    console.log('🛡️ JwtAuthGuard: handleRequest triggered');
    console.log('🧍 User:', user);
    console.log('❗ Error:', err);
    console.log('ℹ️ Info:', info);

    if (err || !user) {
      console.log('❌ JwtAuthGuard: Unauthorized - throwing');
      throw err || new UnauthorizedException();
    }

    return user;
  }
}