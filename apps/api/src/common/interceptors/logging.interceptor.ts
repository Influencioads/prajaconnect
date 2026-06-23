import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../types';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl } = req;
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${originalUrl} ${res.statusCode} ${ms}ms${user ? ` user=${user.id}` : ''}`);
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = (err as { status?: number }).status ?? 500;
          this.logger.error(`${method} ${originalUrl} ${status} ${ms}ms${user ? ` user=${user.id}` : ''} - ${(err as Error).message}`);
        },
      }),
    );
  }
}
