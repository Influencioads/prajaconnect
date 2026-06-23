import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrConfigService } from './pr-config.service';

export interface ArticleAnalysisInput {
  id: string;
  title: string;
  snippet?: string | null;
  source?: string | null;
  publishedAt?: Date | null;
}

export interface ArticleAnalysisResult {
  articleId: string;
  sentiment: string;
  importanceScore: number;
  severity: string;
  mentionsLeader: boolean;
  leaderNamesMentioned: string[];
  summary: string;
  coverageRecommendation: string;
  suggestedResponseOutline: string;
  isOppositionAttack: boolean;
}

export interface ReportSummaryResult {
  summary: string;
  mustCover: { articleId: string; title: string; reason: string; importanceScore: number }[];
  negativePr: { articleId: string; title: string; action: string }[];
}

@Injectable()
export class PrOpenAiService {
  private readonly logger = new Logger(PrOpenAiService.name);

  constructor(private config: PrConfigService) {}

  private client(): OpenAI | null {
    const key = this.config.openAiApiKey();
    if (!key) return null;
    return new OpenAI({ apiKey: key });
  }

  async analyzeArticles(
    articles: ArticleAnalysisInput[],
    leaderNames: string[],
    partyKeywords: string[],
  ): Promise<ArticleAnalysisResult[]> {
    const client = this.client();
    if (!client || articles.length === 0) {
      return articles.map((a) => this.fallbackAnalysis(a));
    }

    const payload = articles.map((a) => ({
      id: a.id,
      title: a.title,
      snippet: a.snippet ?? '',
      source: a.source ?? '',
      publishedAt: a.publishedAt?.toISOString() ?? '',
    }));

    try {
      const response = await client.chat.completions.create({
        model: this.config.openAiModel(),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You analyze Andhra Pradesh political news for a party CRM. Leaders to track: ${leaderNames.join(', ')}. Party/constituency keywords: ${partyKeywords.join(', ')}. Return JSON: { "articles": [ { "articleId", "sentiment" (Positive|Neutral|Negative), "importanceScore" (0-100), "severity" (Low|Medium|High|Critical), "mentionsLeader" (bool), "leaderNamesMentioned" (string[]), "summary", "coverageRecommendation", "suggestedResponseOutline", "isOppositionAttack" (bool) } ] }. Flag isOppositionAttack for negative stories attacking the party/leaders. severity Critical only for major scandals or viral negative coverage requiring immediate admin action.`,
          },
          {
            role: 'user',
            content: JSON.stringify({ articles: payload }),
          },
        ],
        temperature: 0.2,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) return articles.map((a) => this.fallbackAnalysis(a));

      const parsed = JSON.parse(raw) as { articles?: ArticleAnalysisResult[] };
      const byId = new Map((parsed.articles ?? []).map((r) => [r.articleId, r]));

      return articles.map((a) => {
        const found = byId.get(a.id);
        if (!found) return this.fallbackAnalysis(a);
        return {
          articleId: a.id,
          sentiment: found.sentiment ?? 'Neutral',
          importanceScore: Math.max(0, Math.min(100, found.importanceScore ?? 50)),
          severity: found.severity ?? 'Low',
          mentionsLeader: Boolean(found.mentionsLeader),
          leaderNamesMentioned: found.leaderNamesMentioned ?? [],
          summary: found.summary ?? a.title,
          coverageRecommendation: found.coverageRecommendation ?? '',
          suggestedResponseOutline: found.suggestedResponseOutline ?? '',
          isOppositionAttack: Boolean(found.isOppositionAttack),
        };
      });
    } catch (err) {
      this.logger.error('OpenAI analysis failed', err as Error);
      return articles.map((a) => this.fallbackAnalysis(a));
    }
  }

  async generateReportSummary(
    analyzed: ArticleAnalysisResult[],
    articleTitles: Map<string, string>,
  ): Promise<ReportSummaryResult> {
    const client = this.client();
    const mustCoverCandidates = analyzed
      .filter((a) => a.importanceScore >= 60)
      .sort((a, b) => b.importanceScore - a.importanceScore);

    const negativeItems = analyzed.filter(
      (a) => a.sentiment.toLowerCase().includes('negative') || a.isOppositionAttack,
    );

    if (!client) {
      return {
        summary: `Processed ${analyzed.length} article(s). ${mustCoverCandidates.length} flagged for coverage; ${negativeItems.length} negative item(s).`,
        mustCover: mustCoverCandidates.slice(0, 10).map((a) => ({
          articleId: a.articleId,
          title: articleTitles.get(a.articleId) ?? '',
          reason: a.coverageRecommendation || a.summary,
          importanceScore: a.importanceScore,
        })),
        negativePr: negativeItems.slice(0, 10).map((a) => ({
          articleId: a.articleId,
          title: articleTitles.get(a.articleId) ?? '',
          action: a.suggestedResponseOutline || 'Review and draft response',
        })),
      };
    }

    try {
      const response = await client.chat.completions.create({
        model: this.config.openAiModel(),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Summarize this 4-hour political news batch for a PR team lead. Return JSON: { "summary": string (2-4 sentences), "mustCover": [{ "articleId", "title", "reason", "importanceScore" }], "negativePr": [{ "articleId", "title", "action" }] }.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              articles: analyzed.map((a) => ({
                ...a,
                title: articleTitles.get(a.articleId),
              })),
            }),
          },
        ],
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty OpenAI response');
      const parsed = JSON.parse(raw) as ReportSummaryResult;
      return {
        summary: parsed.summary ?? '',
        mustCover: parsed.mustCover ?? [],
        negativePr: parsed.negativePr ?? [],
      };
    } catch (err) {
      this.logger.error('OpenAI report summary failed', err as Error);
      return {
        summary: `Processed ${analyzed.length} article(s) in this period.`,
        mustCover: mustCoverCandidates.slice(0, 10).map((a) => ({
          articleId: a.articleId,
          title: articleTitles.get(a.articleId) ?? '',
          reason: a.coverageRecommendation,
          importanceScore: a.importanceScore,
        })),
        negativePr: negativeItems.slice(0, 10).map((a) => ({
          articleId: a.articleId,
          title: articleTitles.get(a.articleId) ?? '',
          action: a.suggestedResponseOutline || 'Review and draft response',
        })),
      };
    }
  }

  private fallbackAnalysis(article: ArticleAnalysisInput): ArticleAnalysisResult {
    const titleLower = article.title.toLowerCase();
    const negative =
      titleLower.includes('attack') ||
      titleLower.includes('alleg') ||
      titleLower.includes('critic') ||
      titleLower.includes('opposition');
    return {
      articleId: article.id,
      sentiment: negative ? 'Negative' : 'Neutral',
      importanceScore: 40,
      severity: negative ? 'Medium' : 'Low',
      mentionsLeader: false,
      leaderNamesMentioned: [],
      summary: article.snippet ?? article.title,
      coverageRecommendation: negative ? 'Monitor and assess response need' : 'Track for awareness',
      suggestedResponseOutline: negative ? 'Prepare fact-based rebuttal if verified' : '',
      isOppositionAttack: negative,
    };
  }
}
