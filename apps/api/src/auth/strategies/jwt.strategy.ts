import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'praja-access-secret-dev',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!user || user.status === 'Suspended' || user.status === 'Inactive') {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role.name,
      roleLabel: user.role.label,
      rank: user.role.rank,
      language: user.language,
      designation: user.designation,
      photo: user.photo,
      constituencyId: user.constituencyId,
      mandalId: user.mandalId,
      permissions: user.role.permissions.map((rp) => ({
        module: rp.permission.module,
        accessLevel: rp.accessLevel,
      })),
    };
  }
}
