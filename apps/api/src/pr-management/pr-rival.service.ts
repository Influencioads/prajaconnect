import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PrRivalService {
  constructor(private prisma: PrismaService) {}

  async listRivals() {
    return this.prisma.rivalLeader.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { mentions: true } } },
    });
  }

  async createRival(body: { name: string; party?: string; aliases?: string[]; active?: boolean }) {
    return this.prisma.rivalLeader.create({
      data: {
        name: body.name,
        party: body.party,
        aliases: body.aliases ?? [],
        active: body.active ?? true,
      },
    });
  }

  async updateRival(
    id: string,
    body: { name?: string; party?: string; aliases?: string[]; active?: boolean },
  ) {
    const existing = await this.prisma.rivalLeader.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rival leader not found');
    return this.prisma.rivalLeader.update({
      where: { id },
      data: {
        name: body.name,
        party: body.party,
        aliases: body.aliases,
        active: body.active,
      },
    });
  }

  async deleteRival(id: string) {
    const existing = await this.prisma.rivalLeader.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rival leader not found');
    await this.prisma.rivalLeader.delete({ where: { id } });
    return { ok: true };
  }

  /** Sentiment counts by week (last 12 weeks) for one rival. */
  async timeline(id: string) {
    const rival = await this.prisma.rivalLeader.findUnique({ where: { id } });
    if (!rival) throw new NotFoundException('Rival leader not found');

    const since = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
    const mentions = await this.prisma.rivalMention.findMany({
      where: { rivalId: id, createdAt: { gte: since } },
      select: { sentiment: true, createdAt: true },
    });

    const weeks = new Map<
      string,
      { weekStart: string; positive: number; neutral: number; negative: number; total: number }
    >();
    for (const m of mentions) {
      const d = new Date(m.createdAt);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - d.getDay());
      const key = d.toISOString().slice(0, 10);
      const w = weeks.get(key) ?? { weekStart: key, positive: 0, neutral: 0, negative: 0, total: 0 };
      const s = (m.sentiment ?? '').toLowerCase();
      if (s.includes('positive')) w.positive += 1;
      else if (s.includes('negative')) w.negative += 1;
      else w.neutral += 1;
      w.total += 1;
      weeks.set(key, w);
    }

    return {
      rival,
      weeks: [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    };
  }

  async listMentions(query: PaginationDto, rivalId?: string) {
    const { page, limit } = query;
    const where = rivalId ? { rivalId } : {};
    const [data, total] = await Promise.all([
      this.prisma.rivalMention.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rival: { select: { id: true, name: true, party: true } },
          article: { select: { id: true, title: true, source: true, url: true } },
        },
      }),
      this.prisma.rivalMention.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }
}
