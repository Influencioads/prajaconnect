import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Dependency-free fixed-window rate limiter keyed by client IP.
 * Tuned for a single-instance API; swap for Redis-backed limiting when scaling out.
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
  private readonly max = Number(process.env.RATE_LIMIT_MAX) || 300;
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep = Date.now();

  use(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    if (now - this.lastSweep > this.windowMs) {
      for (const [key, b] of this.buckets) {
        if (b.resetAt <= now) this.buckets.delete(key);
      }
      this.lastSweep = now;
    }

    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip || 'unknown';
    let bucket = this.buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(ip, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, this.max - bucket.count);
    res.setHeader('X-RateLimit-Limit', this.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > this.max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
