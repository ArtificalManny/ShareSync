import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req: any = ctx.switchToHttp().getRequest();
    const res: any = ctx.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const dur = Date.now() - start;
        try {
          res.setHeader('Server-Timing', `app;dur=${dur}`);
        } catch {}
        // eslint-disable-next-line no-console
        console.log(`[Timing] ${req.method} ${req.originalUrl || req.url} ${dur}ms`);
      })
    );
  }
}
