import { Injectable } from '@nestjs/common';
import { AiCoreService } from './ai-core.service';

const LANGUAGE_NAMES: Record<string, string> = { te: 'Telugu', en: 'English' };

@Injectable()
export class TranslationService {
  constructor(private aiCore: AiCoreService) {}

  async translate(opts: {
    text: string;
    to: 'te' | 'en';
    from?: 'te' | 'en';
  }): Promise<{ text: string; translated: boolean }> {
    const target = LANGUAGE_NAMES[opts.to];
    const source = opts.from ? `from ${LANGUAGE_NAMES[opts.from]} ` : '';
    const result = await this.aiCore.completeText({
      system: `You are a translation engine. Translate the user's message ${source}to ${target}. Return ONLY the translated text — no explanations, notes, or quotation marks. Preserve names, numbers, and line breaks.`,
      user: opts.text,
    });
    if (!result) return { text: opts.text, translated: false };
    return { text: result.trim(), translated: true };
  }
}
