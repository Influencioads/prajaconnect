import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { AiCoreService } from '../ai-core/ai-core.service';
import { TranslationService } from '../ai-core/translation.service';

export interface DraftReplyRecord {
  referenceNumber: string;
  status: string;
  category?: string | null;
  departmentName?: string | null;
  slaDueAt?: Date | string | null;
  citizenName?: string | null;
  summary?: string | null;
}

export interface DraftReplyResult {
  body: string;
  bodyTe: string;
  source: 'ai' | 'template';
}

function formatDue(value?: Date | string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

@Injectable()
export class GrievanceAiService {
  private readonly logger = new Logger(GrievanceAiService.name);

  constructor(
    private aiCore: AiCoreService,
    private translation: TranslationService,
    private prisma: PrismaService,
  ) {}

  /**
   * Drafts a citizen-facing acknowledgment / status-update reply from real record data.
   * LLM-drafted when configured; deterministic template fallback otherwise. Never auto-sends.
   */
  async draftReply(opts: {
    entityType: 'Grievance' | 'TemporaryGrievance';
    entityId: string;
    record: DraftReplyRecord;
    tone?: string;
    language?: string;
  }): Promise<DraftReplyResult> {
    const { record } = opts;
    const due = formatDue(record.slaDueAt);
    const facts = [
      `Reference number: ${record.referenceNumber}`,
      `Current status: ${record.status}`,
      record.category ? `Category: ${record.category}` : null,
      record.departmentName ? `Handling department: ${record.departmentName}` : null,
      due ? `Expected resolution / SLA due date: ${due}` : null,
      record.citizenName ? `Citizen name: ${record.citizenName}` : null,
      record.summary ? `Issue: ${record.summary}` : null,
    ].filter(Boolean) as string[];

    const input = { facts, tone: opts.tone ?? 'polite', language: opts.language ?? 'en' };
    const ai = await this.aiCore.completeJson<{ body?: string; bodyTe?: string }>({
      system:
        `You draft short ${input.tone} replies (acknowledgment or status update) sent from an MLA constituency office to a citizen about their grievance, via SMS/WhatsApp. ` +
        'Use ONLY the facts provided — never invent statuses, dates, or promises. Cite the reference number. Keep each reply under 500 characters, no placeholders. ' +
        'Return JSON: {"body": "<reply in English>", "bodyTe": "<the same reply in Telugu>"}.',
      user: facts.join('\n'),
    });

    if (ai?.body) {
      const result: DraftReplyResult = { body: ai.body.trim(), bodyTe: (ai.bodyTe ?? ai.body).trim(), source: 'ai' };
      await this.logAi(opts.entityType, opts.entityId, 'draft-reply', input, result);
      return result;
    }

    this.logger.log(`AI draft unavailable for ${opts.entityType}/${opts.entityId}; using template reply`);
    const greeting = record.citizenName ? `Dear ${record.citizenName}, ` : 'Dear citizen, ';
    const body =
      `${greeting}your grievance ${record.referenceNumber}` +
      (record.category ? ` (${record.category})` : '') +
      ` is currently "${record.status}"` +
      (record.departmentName ? ` with ${record.departmentName}` : '') +
      (due ? ` and is expected to be addressed by ${due}` : '') +
      '. Thank you for reaching out — we will keep you updated.';
    const te = await this.translation.translate({ text: body, to: 'te', from: 'en' });
    return { body, bodyTe: te.text, source: 'template' };
  }

  private async logAi(entityType: string, entityId: string, kind: string, input: unknown, output: unknown) {
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
}
