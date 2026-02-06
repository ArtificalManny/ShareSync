// src/common/interceptors/transform.interceptor.ts
// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE TRANSFORM INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has success property, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
          };
        }

        // Wrap in standard response format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
