import { Injectable } from '@nestjs/common';
import { MediaResponseStatus, PrAlertType, PrAlertSeverity } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { PrConfigService } from './pr-config.service';
import { ArticleAnalysisResult, PrOpenAiService } from './pr-openai.service';
import { PrAlertService } from './pr-alert.service';

const MAX_BATCH = 20;

@Injectable()
export class PrAnalysisService {
  constructor(
    private prisma: PrismaService,
    private config: PrConfigService,
    private openai: PrOpenAiService,
    private alerts: PrAlertService,
  ) {}

  async analyzeNewArticles(articleIds: string[]): Promise<ArticleAnalysisResult[]> {
    if (articleIds.length === 0) return [];

    const batch = articleIds.slice(0, MAX_BATCH);
    const articles = await this.prisma.newsArticle.findMany({
      where: { id: { in: batch }, processedAt: null },
    });

    const [leaderNames, partyKeywords] = await Promise.all([
      this.config.leaderNames(),
      this.config.partyKeywords(),
    ]);

    const results = await this.openai.analyzeArticles(
      articles.map((a) => ({
        id: a.id,
        title: a.title,
        snippet: a.summary,
        source: a.source,
        publishedAt: a.publishedAt,
      })),
      leaderNames,
      partyKeywords,
    );

    for (const result of results) {
      await this.applyAnalysis(result, leaderNames);
    }

    return results;
  }

  private async applyAnalysis(result: ArticleAnalysisResult, configuredLeaders: string[]) {
    await this.prisma.newsArticle.update({
      where: { id: result.articleId },
      data: {
        sentiment: result.sentiment,
        importanceScore: result.importanceScore,
        aiSeverity: result.severity,
        summary: result.summary,
        coverageRecommendation: result.coverageRecommendation,
        processedAt: new Date(),
      },
    });

    if (result.mentionsLeader) {
      const names =
        result.leaderNamesMentioned.length > 0
          ? result.leaderNamesMentioned
          : configuredLeaders.slice(0, 1);
      for (const leaderName of names) {
        const existing = await this.prisma.leaderMention.findFirst({
          where: { articleId: result.articleId, leaderName },
        });
        if (!existing) {
          await this.prisma.leaderMention.create({
            data: {
              articleId: result.articleId,
              leaderName,
              sentiment: result.sentiment,
            },
          });
        }
      }
    }

    if (result.severity === 'Critical') {
      await this.alerts.createAlert({
        type: PrAlertType.SeriousConcern,
        severity: PrAlertSeverity.Critical,
        title: 'Critical political news detected',
        body: result.summary,
        linkedArticleId: result.articleId,
        dedupeKey: `serious-concern-article-${result.articleId}`,
        notifyAdmin: true,
      });
    }

    if (
      result.isOppositionAttack &&
      result.importanceScore >= 70 &&
      result.sentiment.toLowerCase().includes('negative')
    ) {
      const article = await this.prisma.newsArticle.findUnique({
        where: { id: result.articleId },
      });
      if (!article) return;

      const existingAttack = await this.prisma.oppositionAttack.findFirst({
        where: { articleId: result.articleId },
      });
      if (existingAttack) return;

      const attack = await this.prisma.oppositionAttack.create({
        data: {
          title: article.title,
          description: `AI-detected negative coverage.\n\n${result.summary}\n\nRecommendation: ${result.coverageRecommendation}`,
          articleId: article.id,
          responseStatus: 'Pending',
        },
      });

      if (result.suggestedResponseOutline) {
        await this.prisma.mediaResponse.create({
          data: {
            attackId: attack.id,
            content: result.suggestedResponseOutline,
            status: MediaResponseStatus.Draft,
          },
        });
      }

      await this.alerts.createAlert({
        type: PrAlertType.NegativePR,
        severity: result.importanceScore >= 85 ? PrAlertSeverity.High : PrAlertSeverity.Medium,
        title: `Negative PR: ${article.title.slice(0, 80)}`,
        body: result.coverageRecommendation,
        linkedArticleId: article.id,
        linkedAttackId: attack.id,
        dedupeKey: `negative-pr-article-${article.id}`,
        notifyAdmin: result.importanceScore >= 85,
      });
    }
  }
}
