import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { OBJECT_ID, actorIdOf } from './project-standing';

// openshare-self-only-v1 (R52)
//
// For routes about one person (a :userId in the address): only that person gets
// an answer. Their growth timeline, for instance, names their Moves and the
// projects those are in, including private projects nobody else may see.
// Runs after JwtAuthGuard. Only a 24-character hex ID can match; anything else
// is refused.

export const SELF_ONLY_REFUSAL = 'You can only see your own data here';

@Injectable()
export class SelfOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = actorIdOf(request?.user);
    const target = request?.params?.userId;
    if (
      !userId ||
      typeof target !== 'string' ||
      !OBJECT_ID.test(target) ||
      target.toLowerCase() !== userId
    ) {
      throw new ForbiddenException(SELF_ONLY_REFUSAL);
    }
    return true;
  }
}
