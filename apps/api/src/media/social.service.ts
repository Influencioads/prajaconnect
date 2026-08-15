import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { AiCoreService } from '../ai-core/ai-core.service';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private prisma: PrismaService,
    private aiCore: AiCoreService,
  ) {}

  // ---------- Post scheduler ----------

  async listPosts(query: PaginationDto & { status?: string; platform?: string }) {
    const { page, limit, status, platform } = query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const [data, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.socialPost.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createPost(
    body: { platform: string; content: string; mediaUrl?: string; scheduledAt?: string },
    userId: string,
  ) {
    return this.prisma.socialPost.create({
      data: {
        platform: body.platform,
        content: body.content,
        mediaUrl: body.mediaUrl,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        createdBy: userId,
      },
    });
  }

  async updatePost(
    id: string,
    body: { platform?: string; content?: string; mediaUrl?: string; scheduledAt?: string | null },
  ) {
    const existing = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Social post not found');
    if (existing.status === 'Posted') throw new BadRequestException('Posted posts cannot be edited');
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        platform: body.platform,
        content: body.content,
        mediaUrl: body.mediaUrl,
        scheduledAt:
          body.scheduledAt === undefined ? undefined : body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
    });
  }

  async deletePost(id: string) {
    const existing = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Social post not found');
    await this.prisma.socialPost.delete({ where: { id } });
    return { ok: true };
  }

  async submitPost(id: string) {
    return this.transition(id, ['Draft'], 'PendingApproval');
  }

  async approvePost(id: string, userId: string) {
    const post = await this.transition(id, ['Draft', 'PendingApproval'], 'Approved');
    return this.prisma.socialPost.update({ where: { id: post.id }, data: { approvedBy: userId } });
  }

  async rejectPost(id: string) {
    return this.transition(id, ['PendingApproval', 'Approved'], 'Draft');
  }

  private async transition(id: string, from: string[], to: string) {
    const existing = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Social post not found');
    if (!from.includes(existing.status)) {
      throw new BadRequestException(`Only ${from.join('/')} posts can move to ${to}`);
    }
    return this.prisma.socialPost.update({ where: { id }, data: { status: to } });
  }

  /**
   * Marks due Approved posts as Posted. Real platform adapters are a later
   * integration; for now posting is simulated.
   */
  async processDuePosts() {
    const due = await this.prisma.socialPost.findMany({
      where: { status: 'Approved', scheduledAt: { not: null, lte: new Date() } },
    });
    for (const post of due) {
      await this.prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'Posted', postedAt: new Date() },
      });
      this.logger.log(`[social] posting simulated (no platform API configured) — ${post.platform} post ${post.id}`);
    }
    return { posted: due.length };
  }

  async isCronEnabled(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'social_cron_enabled' } });
    return (row?.value ?? 'true').toLowerCase() !== 'false';
  }

  // ---------- AI draft ----------

  async draftPost(topic: string, tone?: string) {
    const [promiseTotal, promiseDone, projectTotal, projectDone] = await Promise.all([
      this.prisma.electionPromise.count(),
      this.prisma.electionPromise.count({ where: { workStatus: 'Completed' } }),
      this.prisma.developmentProject.count(),
      this.prisma.developmentProject.count({ where: { status: 'Completed' } }),
    ]);

    const stats = `Manifesto promises completed: ${promiseDone} of ${promiseTotal}. Development projects completed: ${projectDone} of ${projectTotal}.`;

    const content = await this.aiCore.completeText({
      system: `You draft short social media posts for an Andhra Pradesh political party. Tone: ${tone || 'positive'}. Ground any claims strictly in the provided stats — never invent numbers. Max 280 characters. Return only the post text, no quotes or preamble.`,
      user: `Topic: ${topic}\nStats: ${stats}`,
      maxTokens: 200,
    });

    return {
      content: content?.trim() || `${topic} — ${stats}`,
      aiGenerated: Boolean(content),
      grounding: { promiseTotal, promiseDone, projectTotal, projectDone },
    };
  }

  // ---------- Social listening (lite) ----------

  async listMentions(query: PaginationDto & { platform?: string; sentiment?: string }) {
    const { page, limit, search, platform, sentiment } = query;
    const where: Record<string, unknown> = {};
    if (platform) where.platform = platform;
    if (sentiment) where.sentiment = sentiment;
    if (search) where.content = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.socialMention.findMany({
        where,
        orderBy: { fetchedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.socialMention.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }
}
