import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { AiCoreService } from '../ai-core/ai-core.service';
import { TranslationService } from '../ai-core/translation.service';

const COMPLAINT_KEYWORDS = [
  'complaint', 'grievance', 'problem', 'issue', 'not working', 'broken', 'shortage',
  'leak', 'pothole', 'garbage', 'water', 'electricity', 'power', 'road', 'hospital',
  'సమస్య', 'ఫిర్యాదు', 'నీరు', 'కరెంటు', 'రోడ్డు',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Water: ['water', 'drinking', 'tanker', 'నీరు', 'నీటి'],
  Roads: ['road', 'pothole', 'street', 'రోడ్డు'],
  Electricity: ['power', 'electricity', 'current', 'voltage', 'కరెంటు'],
  Sanitation: ['garbage', 'waste', 'drain', 'చెత్త'],
  Health: ['hospital', 'medicine', 'phc', 'doctor', 'ఆరోగ్య'],
  Education: ['school', 'teacher', 'education', 'పాఠశాల'],
  Revenue: ['ration', 'card', 'pension', 'రేషన్'],
};

export interface AiTriageResult {
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  suggestedDepartmentId: string | null;
  suggestedDepartmentName: string | null;
  reasoning: string;
  confidence: number;
  source: 'ai' | 'heuristic';
}

export interface AiDuplicateScores {
  matchScores: Record<string, number>;
  isLikelyDuplicate: boolean;
}

const TRIAGE_CATEGORIES = ['Water', 'Roads', 'Electricity', 'Sanitation', 'Health', 'Education', 'Revenue', 'Other'];

@Injectable()
export class TempGrievancesAiService {
  private readonly logger = new Logger(TempGrievancesAiService.name);

  constructor(
    private translation: TranslationService,
    private aiCore: AiCoreService,
    private prisma: PrismaService,
  ) {}

  /** LLM triage when configured; falls back to the keyword heuristics below. */
  async triage(opts: { entityId: string; text: string }): Promise<AiTriageResult> {
    const departments = await this.prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const input = {
      text: opts.text.slice(0, 4000),
      departments: departments.map((d) => `${d.id}: ${d.name}`),
    };
    const ai = await this.aiCore.completeJson<{
      category?: string;
      suggestedDepartmentId?: string | null;
      priority?: string;
      reasoning?: string;
      confidence?: number;
    }>({
      system:
        'You triage citizen grievances for an MLA constituency office in Andhra Pradesh, India. Messages may be in English, Telugu, or mixed. ' +
        `Return JSON: {"category": one of ${TRIAGE_CATEGORIES.join('|')}, ` +
        '"suggestedDepartmentId": the id of the best-matching department from the provided list (or null), ' +
        '"priority": "Low"|"Medium"|"High"|"Urgent", "reasoning": one short sentence, "confidence": 0-100}.',
      user: `Grievance:\n${input.text}\n\nDepartments:\n${input.departments.join('\n')}`,
    });

    if (ai?.category) {
      const category = TRIAGE_CATEGORIES.includes(ai.category) ? ai.category : 'Other';
      const priority =
        ai.priority === 'Urgent'
          ? 'Critical'
          : ['Low', 'Medium', 'High', 'Critical'].includes(ai.priority ?? '')
            ? (ai.priority as 'Low' | 'Medium' | 'High')
            : 'Medium';
      const dept = departments.find((d) => d.id === ai.suggestedDepartmentId);
      const result: AiTriageResult = {
        category,
        priority,
        suggestedDepartmentId: dept?.id ?? null,
        suggestedDepartmentName: dept?.name ?? null,
        reasoning: ai.reasoning ?? '',
        confidence: Math.max(0, Math.min(100, Math.round(ai.confidence ?? 70))),
        source: 'ai',
      };
      await this.logAi('TemporaryGrievance', opts.entityId, 'triage', input, result);
      return result;
    }

    this.logger.log(`AI triage unavailable for ${opts.entityId}; using keyword heuristics`);
    const cat = this.extractIssueCategory(opts.text);
    const rec = this.recommendDepartment(cat.category);
    const dept = departments.find((d) => d.name === rec.departmentName);
    return {
      category: cat.category,
      priority: this.predictPriority(opts.text),
      suggestedDepartmentId: dept?.id ?? null,
      suggestedDepartmentName: dept?.name ?? rec.departmentName,
      reasoning: 'Keyword-based triage (AI not configured)',
      confidence: Math.round(cat.confidence * 100),
      source: 'heuristic',
    };
  }

  /**
   * LLM duplicate scoring for candidate matches; returns null when AI is unavailable
   * (callers keep their heuristic scores in that case).
   */
  async rescoreDuplicates(opts: {
    entityId: string;
    text: string;
    candidates: { key: string; summary: string }[];
  }): Promise<AiDuplicateScores | null> {
    if (!opts.candidates.length) return null;

    const input = {
      text: opts.text.slice(0, 2000),
      candidates: opts.candidates.slice(0, 20).map((c) => `[${c.key}] ${c.summary.slice(0, 300)}`),
    };
    const ai = await this.aiCore.completeJson<{
      matchScores?: Record<string, number>;
      isLikelyDuplicate?: boolean;
    }>({
      system:
        'You detect duplicate citizen grievances. Compare the new grievance against each candidate (same underlying issue, same citizen/location = duplicate). ' +
        'Return JSON: {"matchScores": {"<candidate key>": 0-100, ...}, "isLikelyDuplicate": true|false}. Score every candidate.',
      user: `New grievance:\n${input.text}\n\nCandidates:\n${input.candidates.join('\n')}`,
    });

    if (!ai?.matchScores) {
      this.logger.log(`AI duplicate scoring unavailable for ${opts.entityId}; keeping heuristic scores`);
      return null;
    }

    const matchScores: Record<string, number> = {};
    for (const [key, score] of Object.entries(ai.matchScores)) {
      if (typeof score === 'number') matchScores[key] = Math.max(0, Math.min(100, Math.round(score)));
    }
    const result: AiDuplicateScores = { matchScores, isLikelyDuplicate: !!ai.isLikelyDuplicate };
    await this.logAi('TemporaryGrievance', opts.entityId, 'duplicate-detection', input, result);
    return result;
  }

  async logAi(entityType: string, entityId: string, kind: string, input: unknown, output: unknown) {
    try {
      await this.prisma.aiTriageLog.create({
        data: {
          entityType,
          entityId,
          kind,
          input: input as Prisma.InputJsonValue,
          output: output as Prisma.InputJsonValue,
          model: await this.aiCore.model(),
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write AiTriageLog (${kind} ${entityType}/${entityId})`, err as Error);
    }
  }

  async latestLog(entityType: string, entityId: string, kind: string) {
    return this.prisma.aiTriageLog.findFirst({
      where: { entityType, entityId, kind },
      orderBy: { createdAt: 'desc' },
    });
  }

  detectComplaintIntent(text: string): { isComplaint: boolean; confidence: number } {
    const lower = text.toLowerCase();
    const matches = COMPLAINT_KEYWORDS.filter((k) => lower.includes(k.toLowerCase()));
    const confidence = Math.min(0.95, 0.3 + matches.length * 0.15);
    return { isComplaint: matches.length > 0, confidence };
  }

  extractIssueCategory(text: string): { category: string; confidence: number } {
    const lower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
        return { category, confidence: 0.75 };
      }
    }
    return { category: 'Other', confidence: 0.4 };
  }

  predictPriority(text: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const lower = text.toLowerCase();
    if (/urgent|emergency|critical|danger|accident|death|అత్యవసర/.test(lower)) return 'Critical';
    if (/not working|shortage|no water|no power|hospital/.test(lower)) return 'High';
    if (/request|need|please|apply/.test(lower)) return 'Medium';
    return 'Low';
  }

  scoreDuplicateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    if (!wordsA.size || !wordsB.size) return 0;
    let overlap = 0;
    for (const w of wordsA) if (wordsB.has(w)) overlap++;
    return Math.round((overlap / Math.max(wordsA.size, wordsB.size)) * 100);
  }

  async translateTeluguToEnglish(text: string): Promise<{ translated: string; detectedLanguage: 'te' | 'en' | 'mixed' }> {
    const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    const detectedLanguage = hasTelugu && hasEnglish ? 'mixed' : hasTelugu ? 'te' : 'en';
    if (!hasTelugu) return { translated: text, detectedLanguage };
    const result = await this.translation.translate({
      text,
      to: 'en',
      from: detectedLanguage === 'te' ? 'te' : undefined,
    });
    return { translated: result.translated ? result.text : text, detectedLanguage };
  }

  generateSummary(text: string): string {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
  }

  recommendDepartment(category: string): { departmentName: string; confidence: number } {
    const map: Record<string, string> = {
      Water: 'Water & Sewerage',
      Roads: 'Roads & Buildings',
      Electricity: 'Electricity (APEPDCL)',
      Sanitation: 'Municipal / Panchayat Raj',
      Health: 'Health & Medical',
      Education: 'Education',
      Revenue: 'Revenue',
    };
    return { departmentName: map[category] ?? 'Municipal / Panchayat Raj', confidence: 0.7 };
  }

  recommendSla(priority: string): number {
    const hours: Record<string, number> = { Critical: 24, High: 48, Medium: 72, Low: 120 };
    return hours[priority] ?? 72;
  }
}
