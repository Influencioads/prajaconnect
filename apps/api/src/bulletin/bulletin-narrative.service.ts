import { Injectable, Logger } from '@nestjs/common';
import { AiCoreService } from '../ai-core/ai-core.service';
import type { BulletinSection } from './bulletin-aggregation.service';

export interface BulletinNarrative {
  narrative: string;
  narrativeTe: string | null;
  generatedBy: 'openai' | 'rule-based';
}

@Injectable()
export class BulletinNarrativeService {
  private readonly logger = new Logger(BulletinNarrativeService.name);

  constructor(private aiCore: AiCoreService) {}

  async compose(sections: BulletinSection[], date: Date, edition: string): Promise<BulletinNarrative> {
    const kpiDigest = sections
      .map((s) => `${s.title}: ${s.kpis.map((k) => `${k.label}=${k.value}${k.delta != null ? ` (Δ${k.delta})` : ''}`).join(', ')}`)
      .join('\n');

    const ai = await this.aiCore.completeJson<{ english: string; telugu: string }>({
      system:
        'You are the chief of staff for an Indian constituency leader. From the KPI digest, write a short executive narrative (4-6 sentences): what changed vs the previous period and what needs attention today. Plain, factual, no flattery. Return JSON {"english": "...", "telugu": "..."} where telugu is the same narrative in Telugu.',
      user: `Bulletin edition: ${edition}, date: ${date.toDateString()}\n\n${kpiDigest}`,
      maxTokens: 700,
    });

    if (ai?.english) {
      return { narrative: ai.english, narrativeTe: ai.telugu ?? null, generatedBy: 'openai' };
    }

    this.logger.log('AI narrative unavailable; using rule-based headline fallback');
    return { narrative: this.ruleBased(sections), narrativeTe: null, generatedBy: 'rule-based' };
  }

  /** Fallback: one headline line per section built from its KPIs. */
  private ruleBased(sections: BulletinSection[]): string {
    const fmtDelta = (d?: number) => (d == null || d === 0 ? '' : d > 0 ? ` (+${d})` : ` (${d})`);
    const lines = sections.map(
      (s) => `${s.title}: ${s.kpis.map((k) => `${k.label} ${k.value}${fmtDelta(k.delta)}`).join(', ')}.`,
    );

    const attention: string[] = [];
    for (const s of sections) {
      for (const k of s.kpis) {
        const bad = ['SLA breached', 'Unacknowledged alerts', 'No check-in', 'Awaiting validation'].includes(k.label);
        if (bad && Number(k.value) > 0) attention.push(`${k.label.toLowerCase()} (${k.value}) in ${s.title}`);
      }
    }
    if (attention.length) lines.push(`Needs attention: ${attention.join('; ')}.`);
    return lines.join('\n');
  }
}
