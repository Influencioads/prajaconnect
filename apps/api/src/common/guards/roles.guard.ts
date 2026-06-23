import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, AccessLevel } from '@praja/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MODULE_KEY, RequiredModule } from '../decorators/require-module.decorator';
import type { AuthenticatedUser } from '../types';

const LEVEL_RANK: Record<string, number> = {
  none: 0,
  view: 1,
  edit: 2,
  full: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredModule = this.reflector.getAllAndOverride<RequiredModule>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredModule) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');

    if (requiredRoles && requiredRoles.length > 0) {
      if (!(requiredRoles as string[]).includes(user.role)) {
        throw new ForbiddenException('Insufficient role');
      }
    }

    if (requiredModule) {
      const perm = user.permissions.find((p) => p.module === requiredModule.module);
      const have = LEVEL_RANK[perm?.accessLevel ?? 'none'] ?? 0;
      const need = LEVEL_RANK[requiredModule.level ?? AccessLevel.view] ?? 1;
      if (have < need) {
        throw new ForbiddenException(`Insufficient access to ${requiredModule.module}`);
      }
    }

    return true;
  }
}
