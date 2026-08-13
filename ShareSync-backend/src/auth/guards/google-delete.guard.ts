import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleDeleteGuard extends AuthGuard('google-delete') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const path = String(req?.path || req?.originalUrl || '');
    const isCallback = path.includes('/google/delete/callback');

    if (isCallback && req?.query?.error) {
      req.googleDeleteOAuthError = String(req.query.error);
      return true;
    }

    if (isCallback && !req?.query?.state) {
      req.googleDeleteOAuthError = 'missing_state';
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const state = String(req?.query?.state || '').trim();

    if (!state) {
      throw new BadRequestException(
        'Missing Google account deletion confirmation state',
      );
    }

    return {
      state,
      prompt: 'select_account',
      session: false,
    };
  }
}
