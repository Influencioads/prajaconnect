import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MediaResponseStatus } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { toCsv, fmtCsvDate } from '../common/utils/csv.util';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const slaHoursSetting = await this.prisma.setting.findUnique({ where: { key: 'pr_response_sla_hours' } });
    const slaHours = parseInt(slaHoursSetting?.value ?? '24', 10) || 24;
    const slaCutoff = new Date(Date.now() - slaHours * 60 * 60 * 1000);

    const [
      totalNews,
      pendingAttacks,
      draftResponses,
      latestScore,
      clippingCount,
      mentionCount,
      recentNews,
      recentAttacks,
      openPrAlerts,
      slaBreaches,
    ] = await Promise.all([
      this.prisma.newsArticle.count(),
      this.prisma.oppositionAttack.count({ where: { responseStatus: 'Pending' } }),
      this.prisma.mediaResponse.count({ where: { status: MediaResponseStatus.Draft } }),
      this.prisma.reputationScoreSnapshot.findFirst({ orderBy: { date: 'desc' } }),
      this.prisma.pressClipping.count(),
      this.prisma.leaderMention.count(),
      this.prisma.newsArticle.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { mentions: true } } },
      }),
      this.prisma.oppositionAttack.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { responses: true } } },
      }),
      this.prisma.prAlert.count({ where: { status: 'Open' } }),
      this.prisma.oppositionAttack.count({
        where: { responseStatus: 'Pending', createdAt: { lt: slaCutoff } },
      }),
    ]);

    return {
      totalNews,
      pendingAttacks,
      draftResponses,
      reputationScore: latestScore?.score ?? 0,
      clippingCount,
      mentionCount,
      recentNews,
      recentAttacks,
      openPrAlerts,
      slaBreaches,
    };
  }

  async listNews(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { source: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { mentions: true } } },
      }),
      this.prisma.newsArticle.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getNews(id: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: { mentions: true },
    });
    if (!article) throw new NotFoundException('News article not found');
    return article;
  }

  async createNews(body: { title: string; source?: string; url?: string; sentiment?: string }) {
    return this.prisma.newsArticle.create({ data: body });
  }

  async updateNews(
    id: string,
    body: { title?: string; source?: string; url?: string; sentiment?: string },
  ) {
    const existing = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('News article not found');
    return this.prisma.newsArticle.update({ where: { id }, data: body });
  }

  async listClippings(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.pressClipping.findMany({
        where,
        orderBy: { clipDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pressClipping.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createClipping(body: { title: string; clipDate?: string; fileUrl?: string }) {
    return this.prisma.pressClipping.create({
      data: {
        title: body.title,
        clipDate: body.clipDate ? new Date(body.clipDate) : undefined,
        fileUrl: body.fileUrl,
      },
    });
  }

  async updateClipping(
    id: string,
    body: { title?: string; clipDate?: string; fileUrl?: string },
  ) {
    const existing = await this.prisma.pressClipping.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Press clipping not found');
    return this.prisma.pressClipping.update({
      where: { id },
      data: {
        title: body.title,
        clipDate: body.clipDate ? new Date(body.clipDate) : undefined,
        fileUrl: body.fileUrl,
      },
    });
  }

  async deleteClipping(id: string) {
    const existing = await this.prisma.pressClipping.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Press clipping not found');
    await this.prisma.pressClipping.delete({ where: { id } });
    return { ok: true };
  }

  async listMentions(query: PaginationDto, articleId?: string) {
    const { page, limit, search } = query;
    const where: {
      articleId?: string;
      OR?: { leaderName?: { contains: string; mode: 'insensitive' }; article?: { title: { contains: string; mode: 'insensitive' } } }[];
    } = {};
    if (articleId) where.articleId = articleId;
    if (search) {
      where.OR = [
        { leaderName: { contains: search, mode: 'insensitive' } },
        { article: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.leaderMention.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { article: { select: { id: true, title: true, source: true } } },
      }),
      this.prisma.leaderMention.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listAttacks(query: PaginationDto) {
    const { page, limit } = query;

    const [data, total] = await Promise.all([
      this.prisma.oppositionAttack.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { responses: { orderBy: { createdAt: 'desc' }, take: 3 } },
      }),
      this.prisma.oppositionAttack.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getAttack(id: string) {
    const attack = await this.prisma.oppositionAttack.findUnique({
      where: { id },
      include: { responses: { orderBy: { createdAt: 'desc' } } },
    });
    if (!attack) throw new NotFoundException('Attack record not found');
    return attack;
  }

  async createAttack(body: { title: string; description?: string }) {
    return this.prisma.oppositionAttack.create({ data: body });
  }

  async updateAttack(
    id: string,
    body: { title?: string; description?: string; responseStatus?: string },
  ) {
    const existing = await this.prisma.oppositionAttack.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attack record not found');
    return this.prisma.oppositionAttack.update({ where: { id }, data: body });
  }

  async listResponses(query: PaginationDto, attackId?: string) {
    const { page, limit } = query;
    const where = attackId ? { attackId } : {};

    const [data, total] = await Promise.all([
      this.prisma.mediaResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { attack: { select: { id: true, title: true } } },
      }),
      this.prisma.mediaResponse.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getResponse(id: string) {
    const response = await this.prisma.mediaResponse.findUnique({
      where: { id },
      include: { attack: { select: { id: true, title: true, description: true } } },
    });
    if (!response) throw new NotFoundException('Media response not found');
    return response;
  }

  async createResponse(body: { attackId: string; content: string; status?: string }) {
    return this.prisma.mediaResponse.create({
      data: {
        attackId: body.attackId,
        content: body.content,
        status: (body.status as MediaResponseStatus) ?? MediaResponseStatus.Draft,
      },
      include: { attack: { select: { id: true, title: true } } },
    });
  }

  async updateResponse(id: string, body: { content?: string; status?: string }) {
    const existing = await this.prisma.mediaResponse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Media response not found');

    const response = await this.prisma.mediaResponse.update({
      where: { id },
      data: {
        content: body.content,
        status: body.status as MediaResponseStatus | undefined,
      },
      include: { attack: { select: { id: true, title: true } } },
    });

    if (body.status === MediaResponseStatus.Published) {
      await this.syncAttackResponseStatus(response.attackId, 'Published');
    }

    return response;
  }

  async approveResponse(id: string) {
    const existing = await this.prisma.mediaResponse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Media response not found');
    if (
      existing.status !== MediaResponseStatus.Draft &&
      existing.status !== MediaResponseStatus.PendingApproval
    ) {
      throw new BadRequestException('Only draft or pending responses can be approved');
    }
    return this.prisma.mediaResponse.update({
      where: { id },
      data: { status: MediaResponseStatus.Approved },
      include: { attack: { select: { id: true, title: true } } },
    });
  }

  async publishResponse(id: string) {
    const existing = await this.prisma.mediaResponse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Media response not found');
    if (
      existing.status !== MediaResponseStatus.Approved &&
      existing.status !== MediaResponseStatus.PendingApproval
    ) {
      throw new BadRequestException('Response must be approved before publishing');
    }
    const response = await this.prisma.mediaResponse.update({
      where: { id },
      data: { status: MediaResponseStatus.Published },
      include: { attack: { select: { id: true, title: true } } },
    });
    await this.syncAttackResponseStatus(response.attackId, 'Published');
    return response;
  }

  private async syncAttackResponseStatus(attackId: string, status: string) {
    await this.prisma.oppositionAttack.update({
      where: { id: attackId },
      data: { responseStatus: status },
    });
  }

  async listReputationSnapshots(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.reputationScoreSnapshot.findMany({
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reputationScoreSnapshot.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async computeReputationScore() {
    const [articles, attacks, pendingResponses] = await Promise.all([
      this.prisma.newsArticle.findMany({ select: { sentiment: true } }),
      this.prisma.oppositionAttack.count({ where: { responseStatus: 'Pending' } }),
      this.prisma.mediaResponse.count({
        where: { status: { in: [MediaResponseStatus.Draft, MediaResponseStatus.PendingApproval] } },
      }),
    ]);

    let sentimentScore = 50;
    for (const a of articles) {
      const s = (a.sentiment ?? '').toLowerCase();
      if (s.includes('positive')) sentimentScore += 2;
      else if (s.includes('negative')) sentimentScore -= 3;
    }
    sentimentScore -= attacks * 5;
    sentimentScore -= pendingResponses * 2;
    const score = Math.max(0, Math.min(100, Math.round(sentimentScore)));

    return this.prisma.reputationScoreSnapshot.create({ data: { score } });
  }

  async listSocialListening(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? {
          OR: [
            { platform: { contains: search, mode: 'insensitive' as const } },
            { keyword: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.socialListeningPlaceholder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.socialListeningPlaceholder.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createSocialListening(body: { platform: string; keyword: string; notes?: string }) {
    return this.prisma.socialListeningPlaceholder.create({ data: body });
  }

  async updateSocialListening(
    id: string,
    body: { platform?: string; keyword?: string; notes?: string },
  ) {
    const existing = await this.prisma.socialListeningPlaceholder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Social listening entry not found');
    return this.prisma.socialListeningPlaceholder.update({ where: { id }, data: body });
  }

  async deleteSocialListening(id: string) {
    const existing = await this.prisma.socialListeningPlaceholder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Social listening entry not found');
    await this.prisma.socialListeningPlaceholder.delete({ where: { id } });
    return { ok: true };
  }

  async exportCsv(type: string) {
    if (type === 'news') {
      const rows = await this.prisma.newsArticle.findMany({ take: 5000, orderBy: { createdAt: 'desc' } });
      return toCsv(rows, [
        { header: 'title', value: (r) => r.title },
        { header: 'source', value: (r) => r.source },
        { header: 'sentiment', value: (r) => r.sentiment },
        { header: 'createdAt', value: (r) => fmtCsvDate(r.createdAt) },
      ]);
    }
    if (type === 'attacks') {
      const rows = await this.prisma.oppositionAttack.findMany({ take: 5000, orderBy: { createdAt: 'desc' } });
      return toCsv(rows, [
        { header: 'title', value: (r) => r.title },
        { header: 'responseStatus', value: (r) => r.responseStatus },
        { header: 'createdAt', value: (r) => fmtCsvDate(r.createdAt) },
      ]);
    }
    if (type === 'clippings') {
      const rows = await this.prisma.pressClipping.findMany({ take: 5000, orderBy: { clipDate: 'desc' } });
      return toCsv(rows, [
        { header: 'title', value: (r) => r.title },
        { header: 'clipDate', value: (r) => fmtCsvDate(r.clipDate) },
        { header: 'fileUrl', value: (r) => r.fileUrl },
      ]);
    }
    if (type === 'reputation') {
      const rows = await this.prisma.reputationScoreSnapshot.findMany({ take: 5000, orderBy: { date: 'desc' } });
      return toCsv(rows, [
        { header: 'score', value: (r) => r.score },
        { header: 'date', value: (r) => fmtCsvDate(r.date) },
      ]);
    }
    throw new BadRequestException(`Unsupported export type: ${type}`);
  }
}
