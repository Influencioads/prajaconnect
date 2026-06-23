import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types';
import { LoginDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function clientIp(ip?: string) {
  return ip ?? null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private userInclude = {
    role: { include: { permissions: { include: { permission: true } } } },
  };

  private toAuthUser(user: any): AuthenticatedUser {
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
      permissions: user.role.permissions.map((rp: any) => ({
        module: rp.permission.module,
        accessLevel: rp.accessLevel,
      })),
    };
  }

  private async issueTokens(user: { id: string; email: string; role: { name: string } }) {
    const payload = { sub: user.id, email: user.email, role: user.role.name };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'praja-access-secret-dev',
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    } as any);
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'praja-refresh-secret-dev',
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    } as any);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
    });
    await this.prisma.userSession.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier.toLowerCase() }, { mobile: dto.identifier }] },
      include: this.userInclude,
    });

    if (!user) {
      await this.prisma.loginHistory.create({ data: { success: false, ip: clientIp(ip) } });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== 'Active') {
      await this.prisma.loginHistory.create({ data: { userId: user.id, success: false, ip: clientIp(ip) } });
      throw new UnauthorizedException('Account is not active');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.prisma.loginHistory.create({ data: { userId: user.id, success: false, ip: clientIp(ip) } });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.loginHistory.create({ data: { userId: user.id, success: true, ip: clientIp(ip) } });

    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'praja-refresh-secret-dev',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash: hashToken(refreshToken), revoked: false },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: this.userInclude,
    });
    if (!user || user.status !== 'Active') throw new UnauthorizedException('Account is not active');

    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash },
        data: { revoked: true },
      });
      await this.prisma.userSession.updateMany({
        where: { userId, tokenHash },
        data: { revoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
      await this.prisma.userSession.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    }
    return { success: true };
  }

  async requestOtp(dto: RequestOtpDto) {
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.prisma.otpToken.create({
      data: { mobile: dto.mobile, code, purpose: dto.purpose ?? 'login', expiresAt },
    });
    this.logger.warn(`[OTP placeholder] ${dto.mobile} -> ${code} (no SMS gateway configured)`);
    return {
      success: true,
      message: 'OTP generated (placeholder — no SMS gateway configured)',
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ip?: string) {
    const otp = await this.prisma.otpToken.findFirst({
      where: { mobile: dto.mobile, code: dto.code, consumed: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.prisma.otpToken.update({ where: { id: otp.id }, data: { consumed: true } });

    const user = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile },
      include: this.userInclude,
    });
    if (!user || user.status !== 'Active') throw new UnauthorizedException('No active account for this mobile');

    await this.prisma.loginHistory.create({ data: { userId: user.id, success: true, ip: clientIp(ip) } });
    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), ...tokens };
  }
}
