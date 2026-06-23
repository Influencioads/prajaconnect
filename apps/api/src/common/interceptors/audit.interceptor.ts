import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import { AuditAction } from '@praja/types';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../types';

const METHOD_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.Create,
  PUT: AuditAction.Update,
  PATCH: AuditAction.Update,
  DELETE: AuditAction.Delete,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();
    const path = req.originalUrl.split('?')[0];

    // Only audit state-changing requests.
    if (!METHOD_ACTION[method] && !path.includes('/auth/login')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((body) => {
        void this.record(req, method, path, body);
      }),
    );
  }

  private async record(req: Request, method: string, path: string, body: unknown) {
    try {
      const user = (req as Request & { user?: AuthenticatedUser }).user;
      const segments = path.replace(/^\/api\//, '').split('/').filter(Boolean);
      const entity = segments[0] ?? 'unknown';
      const entityId =
        (req.params as Record<string, string> | undefined)?.id ??
        (body && typeof body === 'object' && 'id' in body ? String((body as { id: unknown }).id) : null);

      const action: AuditAction = path.includes('/auth/login') ? AuditAction.Login : METHOD_ACTION[method];
      const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip || null;

      await this.prisma.auditLog.create({
        data: {
          userId: user?.id ?? null,
          userName: user?.name ?? null,
          action,
          entity,
          entityId,
          summary: `${method} ${path}`,
          ip,
        },
      });
    } catch (err) {
      // Never let auditing break the request lifecycle.
      this.logger.warn(`Failed to write audit log: ${(err as Error).message}`);
    }
  }
}
