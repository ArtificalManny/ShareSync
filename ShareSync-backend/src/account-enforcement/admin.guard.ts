import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req?.user || {};

    const roles = Array.isArray(user.roles)
      ? user.roles.map((role: any) => String(role).toLowerCase())
      : [];

    const role = String(user.role || '').toLowerCase();

    const isAdmin =
      user.isAdmin === true ||
      role === 'admin' ||
      roles.includes('admin') ||
      roles.includes('founder');

    if (!isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
