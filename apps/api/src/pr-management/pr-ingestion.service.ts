import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ARTICLES_PER_SOURCE = 50;

export interface IngestedItem {
  title: string;
  url?: string;
  externalId?: string;
  snippet?: string;
  publishedAt?: Date;
  sourceName: string;
  sourceId: string;
  contentHash: string;
}

@Injectable()
export class PrIngestionService {
  private readonly logger = new Logger(PrIngestionService.name);
  private readonly parser = new Parser({ timeout: 15000 });

  constructor(private prisma: PrismaService) {}

  normalizeUrl(raw: string): string {
    try {
      const u = new URL(raw.trim());
      u.hash = '';
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((p) =>
        u.searchParams.delete(p),
      );
      return u.toString();
    } catch {
      return raw.trim().toLowerCase();
    }
  }

  hashContent(url: string): string {
    return createHash('sha256').update(this.normalizeUrl(url)).digest('hex');
  }

  hashTitle(title: string, sourceId: string): string {
    return createHash('sha256').update(`${sourceId}:${title.trim().toLowerCase()}`).digest('hex');
  }

  async fetchSource(source: { id: string; name: string; url: string }): Promise<{
    items: IngestedItem[];
    error?: string;
  }> {
    try {
      const feed = await this.parser.parseURL(source.url);
      const items: IngestedItem[] = [];
      for (const entry of (feed.items ?? []).slice(0, MAX_ARTICLES_PER_SOURCE)) {
        const title = (entry.title ?? '').trim();
        if (!title) continue;
        const link = entry.link ?? entry.guid;
        const contentHash = link
          ? this.hashContent(link)
          : this.hashTitle(title, source.id);
        items.push({
          title,
          url: link,
          externalId: entry.guid ?? entry.id,
          snippet: entry.contentSnippet ?? entry.summary ?? undefined,
          publishedAt: entry.pubDate ? new Date(entry.pubDate) : undefined,
          sourceName: source.name,
          sourceId: source.id,
          contentHash,
        });
      }
      return { items };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`RSS fetch failed for ${source.name}: ${message}`);
      return { items: [], error: message };
    }
  }

  async ingestAll(runId: string): Promise<{
    sourcesChecked: number;
    articlesFetched: number;
    articlesNew: number;
    errors: { source: string; error: string }[];
    newArticleIds: string[];
  }> {
    const sources = await this.prisma.newsSource.findMany({ where: { enabled: true } });
    let articlesFetched = 0;
    let articlesNew = 0;
    const errors: { source: string; error: string }[] = [];
    const newArticleIds: string[] = [];

    for (const source of sources) {
      const { items, error } = await this.fetchSource(source);
      articlesFetched += items.length;

      if (error) {
        errors.push({ source: source.name, error });
        await this.prisma.newsSource.update({
          where: { id: source.id },
          data: { lastError: error },
        });
        continue;
      }

      await this.prisma.newsSource.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date(), lastError: null },
      });

      for (const item of items) {
        const existing = await this.prisma.newsArticle.findUnique({
          where: { contentHash: item.contentHash },
          select: { id: true },
        });
        if (existing) continue;

        const article = await this.prisma.newsArticle.create({
          data: {
            title: item.title,
            source: item.sourceName,
            url: item.url,
            externalId: item.externalId,
            contentHash: item.contentHash,
            summary: item.snippet,
            publishedAt: item.publishedAt,
            sourceId: item.sourceId,
            ingestionRunId: runId,
          },
        });
        articlesNew += 1;
        newArticleIds.push(article.id);
      }
    }

    return {
      sourcesChecked: sources.length,
      articlesFetched,
      articlesNew,
      errors,
      newArticleIds,
    };
  }

  async testSource(url: string): Promise<{ ok: boolean; itemCount: number; sampleTitles: string[]; error?: string }> {
    const result = await this.fetchSource({ id: 'test', name: 'Test', url });
    if (result.error) {
      return { ok: false, itemCount: 0, sampleTitles: [], error: result.error };
    }
    return {
      ok: true,
      itemCount: result.items.length,
      sampleTitles: result.items.slice(0, 5).map((i) => i.title),
    };
  }
}
