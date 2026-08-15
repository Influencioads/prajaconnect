import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

@Injectable()
export class AiCoreService {
  private readonly logger = new Logger(AiCoreService.name);
  private warnedNoKey = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async setting(key: string, envFallback?: string): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row?.value) return row.value;
    return envFallback ?? '';
  }

  async model(): Promise<string> {
    const val = await this.setting('openai_model', this.config.get('OPENAI_MODEL', 'gpt-4o-mini'));
    return val || 'gpt-4o-mini';
  }

  async client(): Promise<OpenAI | null> {
    const key = await this.setting('openai_api_key', this.config.get('OPENAI_API_KEY', ''));
    if (!key) {
      if (!this.warnedNoKey) {
        this.warnedNoKey = true;
        this.logger.log('OPENAI_API_KEY not configured; AI features run in fallback mode');
      }
      return null;
    }
    return new OpenAI({ apiKey: key });
  }

  async completeText(req: CompletionRequest): Promise<string | null> {
    const client = await this.client();
    if (!client) return null;
    try {
      const response = await client.chat.completions.create({
        model: await this.model(),
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        temperature: 0.2,
        ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
      });
      return response.choices[0]?.message?.content ?? null;
    } catch (err) {
      this.logger.error('OpenAI text completion failed', err as Error);
      return null;
    }
  }

  async completeJson<T>(req: CompletionRequest): Promise<T | null> {
    const client = await this.client();
    if (!client) return null;
    try {
      const response = await client.chat.completions.create({
        model: await this.model(),
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        temperature: 0.2,
        ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
      });
      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.error('OpenAI JSON completion failed', err as Error);
      return null;
    }
  }
}
