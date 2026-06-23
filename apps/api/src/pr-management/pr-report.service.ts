import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrOpenAiService, ArticleAnalysisResult } from './pr-openai.service';

@Injectable()
export class PrReportService {
  constructor(
    private prisma: PrismaService,
    private openai: PrOpenAiService,
  ) {}

  async createPeriodReport(
    periodStart: Date,
    periodEnd: Date,
    analyzed: ArticleAnalysisResult[],
  ) {
    const articleIds = analyzed.map((a) => a.articleId);
    const articles = await this.prisma.newsArticle.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, title: true, sentiment: true, source: true },
    });
    const titleMap = new Map(articles.map((a) => [a.id, a.title]));

    const reportData = await this.openai.generateReportSummary(analyzed, titleMap);

    const stats = {
      totalAnalyzed: analyzed.length,
      positive: analyzed.filter((a) => a.sentiment.toLowerCase().includes('positive')).length,
      neutral: analyzed.filter((a) => a.sentiment.toLowerCase().includes('neutral')).length,
      negative: analyzed.filter((a) => a.sentiment.toLowerCase().includes('negative')).length,
      highImportance: analyzed.filter((a) => a.importanceScore >= 70).length,
      oppositionAttacks: analyzed.filter((a) => a.isOppositionAttack).length,
      sources: [...new Set(articles.map((a) => a.source).filter(Boolean))],
    };

    return this.prisma.prReport.create({
      data: {
        periodStart,
        periodEnd,
        summary: reportData.summary,
        mustCoverJson: reportData.mustCover,
        negativePrJson: reportData.negativePr,
        statsJson: stats,
        generatedBy: 'openai',
      },
    });
  }

  async getLatest() {
    return this.prisma.prReport.findFirst({ orderBy: { createdAt: 'desc' } });
  }
}
