import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { UserRole } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { AiCoreService } from '../ai-core/ai-core.service';
import { TranslationService } from '../ai-core/translation.service';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import { TempGrievancesService } from '../temp-grievances/temp-grievances.service';
import { PublicPortalService } from '../public-portal/public-portal.service';
import { WhatsappService } from './whatsapp.service';
import { WhatsappBotConfigService } from './whatsapp-bot-config.service';
import type { AuthenticatedUser } from '../common/types';

type BotIntent = 'FileGrievance' | 'CheckStatus' | 'SchemeQuery' | 'Greeting' | 'Handoff';

interface BotEntities {
  name?: string;
  village?: string;
  issue?: string;
  reference?: string;
  age?: number;
  income?: number;
  occupation?: string;
}

interface BotState {
  intent?: BotIntent;
  step?: 'name' | 'village' | 'issue';
  language?: 'te' | 'en';
  name?: string;
  village?: string;
  done?: boolean;
  reference?: string;
}

const BOT_USER: AuthenticatedUser = {
  id: 'system',
  name: 'WhatsApp Bot',
  email: 'bot@praja.in',
  mobile: '0000000000',
  role: UserRole.Volunteer,
  roleLabel: 'WhatsApp Bot',
  rank: 0,
  language: 'en',
  permissions: [],
};

const REF_RE = /\b(GRV|TMP)[-\s]?(\d{3,})\b/i;
// Telugu Unicode block U+0C00–U+0C7F
const TELUGU_RE = /[ఀ-౿]/;

const INTENTS: BotIntent[] = ['FileGrievance', 'CheckStatus', 'SchemeQuery', 'Greeting', 'Handoff'];

@Injectable()
export class WhatsappBotService {
  private readonly logger = new Logger(WhatsappBotService.name);

  constructor(
    private prisma: PrismaService,
    private aiCore: AiCoreService,
    private translation: TranslationService,
    private dispatch: NotificationDispatchService,
    private tempGrievances: TempGrievancesService,
    private publicPortal: PublicPortalService,
    private whatsapp: WhatsappService,
    private config: WhatsappBotConfigService,
  ) {}

  detectLanguage(text: string): 'te' | 'en' {
    return TELUGU_RE.test(text) ? 'te' : 'en';
  }

  /** Hand the conversation back to the bot after a human handoff. */
  async resume(conversationId: string) {
    await this.prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { status: 'open' },
    });
    return { resumed: true };
  }

  async listSessions() {
    return this.prisma.botSession.findMany({
      include: {
        conversation: {
          select: { id: true, contactName: true, contactMobile: true, status: true, lastMessageAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  /** Entry point: called after an inbound message has been persisted. */
  async handleInbound(conversationId: string, body: string, messageId: string) {
    if (!(await this.config.isBotEnabled())) {
      this.logger.log('WhatsApp bot disabled — skipping inbound message');
      return { skipped: 'bot disabled' };
    }

    const conv = await this.prisma.whatsappConversation.findUnique({ where: { id: conversationId } });
    if (!conv) return { skipped: 'conversation not found' };
    if (conv.status === 'bot_paused') return { skipped: 'bot paused — human handling' };

    const lang = this.detectLanguage(body);

    const session = await this.prisma.botSession.findUnique({ where: { conversationId } });
    const state = (session?.state ?? {}) as BotState;

    if (state.intent === 'FileGrievance' && !state.done) {
      return this.continueSlotFilling(conversationId, state, body, lang, messageId);
    }

    const { intent, entities } = await this.detectIntent(conversationId, body);

    switch (intent) {
      case 'Greeting':
        return this.reply(conversationId, await this.config.greeting(), lang);
      case 'FileGrievance':
        return this.startSlotFilling(conversationId, entities, lang);
      case 'CheckStatus':
        return this.checkStatus(conversationId, entities.reference ?? body, lang);
      case 'SchemeQuery':
        return this.schemeQuery(conversationId, entities, lang);
      case 'Handoff':
      default:
        return this.handoff(conversationId, body);
    }
  }

  private async detectIntent(conversationId: string, body: string): Promise<{ intent: BotIntent; entities: BotEntities }> {
    const recent = await this.prisma.whatsappMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const context = recent
      .reverse()
      .map((m) => `${m.direction === 'Inbound' ? 'Citizen' : 'Assistant'}: ${m.body}`)
      .join('\n');

    const result = await this.aiCore.completeJson<{ intent?: string; entities?: BotEntities }>({
      system:
        'You are the WhatsApp citizen assistant of a constituency office in Andhra Pradesh. ' +
        'Messages may be in English or Telugu. Classify the citizen\'s LATEST message into one intent: ' +
        'FileGrievance (wants to report a problem/complaint), CheckStatus (asks about an existing grievance, often with a reference like GRV-1001 or TMP-1001), ' +
        'SchemeQuery (asks about welfare schemes/benefits/eligibility), Greeting (hello/thanks/small talk), ' +
        'Handoff (asks for a human, is angry, or the request is unrelated). ' +
        'Extract entities when present. Respond ONLY with JSON: ' +
        '{"intent":"FileGrievance|CheckStatus|SchemeQuery|Greeting|Handoff","entities":{"name":"","village":"","issue":"","reference":"","age":0,"income":0,"occupation":""}} ' +
        'omitting entity keys you did not find.',
      user: `Conversation so far:\n${context}\n\nLatest citizen message: ${body}`,
      maxTokens: 300,
    });

    if (result?.intent && INTENTS.includes(result.intent as BotIntent)) {
      return { intent: result.intent as BotIntent, entities: result.entities ?? {} };
    }
    return this.fallbackIntent(body);
  }

  /** Keyword fallback when the AI is unconfigured or returns garbage. */
  private fallbackIntent(body: string): { intent: BotIntent; entities: BotEntities } {
    const refMatch = body.match(REF_RE);
    if (refMatch || /\bstatus\b/i.test(body)) {
      return { intent: 'CheckStatus', entities: refMatch ? { reference: `${refMatch[1]}-${refMatch[2]}`.toUpperCase() } : {} };
    }
    if (/^(hi|hello|hey|hai|namaste|namaskaram|good\s*(morning|evening|afternoon)|thank|నమస్|ధన్యవాద)/i.test(body.trim())) {
      return { intent: 'Greeting', entities: {} };
    }
    if (/scheme|pension|benefit|eligib|పథక|పింఛ|అర్హత/i.test(body)) {
      return { intent: 'SchemeQuery', entities: {} };
    }
    if (/complain|grievance|problem|issue|broken|no water|road|electric|drain|సమస్య|ఫిర్యాదు|రోడ్డు|నీరు|కరెంట్/i.test(body)) {
      return { intent: 'FileGrievance', entities: {} };
    }
    return { intent: 'Handoff', entities: {} };
  }

  // ---------- FileGrievance slot filling ----------

  private async startSlotFilling(conversationId: string, entities: BotEntities, lang: 'te' | 'en') {
    const state: BotState = {
      intent: 'FileGrievance',
      language: lang,
      name: entities.name?.trim() || undefined,
      village: entities.village?.trim() || undefined,
    };
    // ponytail: fixed name -> village -> issue order; issue is always re-asked so the
    // final citizen message carries the full description used for intake.
    state.step = !state.name ? 'name' : !state.village ? 'village' : 'issue';

    await this.saveState(conversationId, state);
    return this.reply(conversationId, this.slotQuestion(state), lang);
  }

  private async continueSlotFilling(
    conversationId: string,
    state: BotState,
    body: string,
    lang: 'te' | 'en',
    messageId: string,
  ) {
    if (/^(cancel|stop|రద్దు)/i.test(body.trim())) {
      await this.prisma.botSession.delete({ where: { conversationId } }).catch(() => undefined);
      return this.reply(conversationId, 'Okay, I have cancelled that. How else can I help you?', lang);
    }

    if (state.step === 'name') {
      state.name = body.trim().slice(0, 120);
      state.step = 'village';
      await this.saveState(conversationId, state);
      return this.reply(conversationId, this.slotQuestion(state), lang);
    }

    if (state.step === 'village') {
      state.village = body.trim().slice(0, 120);
      state.step = 'issue';
      await this.saveState(conversationId, state);
      return this.reply(conversationId, this.slotQuestion(state), lang);
    }

    // step === 'issue' — all slots filled, create the temporary grievance.
    return this.completeSlotFilling(conversationId, state, body, lang, messageId);
  }

  private slotQuestion(state: BotState): string {
    if (state.step === 'name') return 'I can register your grievance. First, what is your full name?';
    if (state.step === 'village') {
      return `Thank you${state.name ? `, ${state.name}` : ''}. Which village or area are you from?`;
    }
    return 'Please describe your issue in a few sentences.';
  }

  private async completeSlotFilling(
    conversationId: string,
    state: BotState,
    body: string,
    lang: 'te' | 'en',
    messageId: string,
  ) {
    // Reuse the existing WhatsApp intake path (ticket id, AI categorisation, SLA, duplicate
    // detection). receiveInbound may already have auto-created a pending temp grievance from
    // one of this session's messages — enrich that one instead of double-ticketing.
    // ponytail: 24h window instead of exact session tracking — sessions are short-lived.
    const existing = await this.prisma.temporaryGrievance.findFirst({
      where: {
        whatsappConversationId: conversationId,
        validationStatus: 'PendingValidation',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    const temp =
      existing ?? (await this.tempGrievances.fromWhatsapp({ conversationId, messageId }, BOT_USER));

    const village = state.village
      ? await this.prisma.village.findFirst({
          where: { name: { equals: state.village, mode: 'insensitive' } },
          select: { id: true },
        })
      : null;

    const updated = await this.prisma.temporaryGrievance.update({
      where: { id: temp.id },
      data: {
        citizenName: state.name ?? undefined,
        address: state.village ?? undefined,
        villageId: village?.id ?? undefined,
        // If the reused ticket came from an earlier trigger message, the collected
        // issue text is the fuller description.
        ...(existing && existing.sourceReferenceId !== messageId ? { issueDescription: body } : {}),
      },
      select: { tempTicketId: true },
    });

    state.done = true;
    state.step = undefined;
    state.reference = updated.tempTicketId;
    await this.saveState(conversationId, state);

    return this.reply(
      conversationId,
      `Your grievance has been registered with reference ${updated.tempTicketId}. Our team will validate it and get back to you. Send "status ${updated.tempTicketId}" anytime to check progress.`,
      lang,
    );
  }

  private async saveState(conversationId: string, state: BotState) {
    await this.prisma.botSession.upsert({
      where: { conversationId },
      create: { conversationId, state: state as unknown as Prisma.InputJsonValue },
      update: { state: state as unknown as Prisma.InputJsonValue },
    });
  }

  // ---------- CheckStatus ----------

  private async checkStatus(conversationId: string, refText: string, lang: 'te' | 'en') {
    const match = refText.match(REF_RE);
    if (!match) {
      return this.reply(
        conversationId,
        'Please share your reference number (for example GRV-1001 or TMP-1001) and I will check the status.',
        lang,
      );
    }
    const ref = `${match[1]}-${match[2]}`.toUpperCase();

    // Same lookup shape as the public portal track-by-ref endpoint.
    const grievance = await this.prisma.grievance.findFirst({
      where: { code: { equals: ref, mode: 'insensitive' } },
      select: { code: true, title: true, status: true, updatedAt: true, resolvedAt: true },
    });
    if (grievance) {
      return this.reply(
        conversationId,
        `${grievance.code} — ${grievance.title}\nStatus: ${grievance.status}${grievance.resolvedAt ? ' (resolved)' : ''}\nLast update: ${grievance.updatedAt.toDateString()}`,
        lang,
      );
    }

    const temp = await this.prisma.temporaryGrievance.findFirst({
      where: { tempTicketId: { equals: ref, mode: 'insensitive' } },
      select: {
        tempTicketId: true,
        issueSummary: true,
        validationStatus: true,
        updatedAt: true,
        convertedGrievance: { select: { code: true, status: true } },
      },
    });
    if (temp) {
      const text = temp.convertedGrievance
        ? `${temp.tempTicketId} was converted to grievance ${temp.convertedGrievance.code}.\nStatus: ${temp.convertedGrievance.status}`
        : `${temp.tempTicketId}${temp.issueSummary ? ` — ${temp.issueSummary}` : ''}\nStatus: ${temp.validationStatus}\nLast update: ${temp.updatedAt.toDateString()}`;
      return this.reply(conversationId, text, lang);
    }

    return this.reply(
      conversationId,
      `I could not find any grievance with reference ${ref}. Please check the number and try again.`,
      lang,
    );
  }

  // ---------- SchemeQuery ----------

  private async schemeQuery(conversationId: string, entities: BotEntities, lang: 'te' | 'en') {
    // Reuse the public-portal eligibility-check service.
    const result = await this.publicPortal.checkSchemeEligibility({
      age: entities.age,
      income: entities.income,
      occupation: entities.occupation,
    });

    if (!result.schemes.length) {
      return this.reply(conversationId, 'There are no active schemes right now. Please check back later.', lang);
    }

    const hasParams = entities.age != null || entities.income != null || !!entities.occupation;
    const eligible = result.schemes.filter((s) => s.eligible);
    const shown = hasParams && eligible.length ? eligible : result.schemes;
    const lines = shown
      .slice(0, 5)
      .map((s) => `• ${s.name}${s.benefitAmount ? ` — ₹${s.benefitAmount}` : ''}`)
      .join('\n');
    const header =
      hasParams && eligible.length
        ? `Based on what you shared, you may be eligible for:`
        : `Active welfare schemes:`;

    return this.reply(
      conversationId,
      `${header}\n${lines}\nReply with your age, income and occupation for a personalised eligibility check.`,
      lang,
    );
  }

  // ---------- Handoff ----------

  private async handoff(conversationId: string, lastMessage: string) {
    const conv = await this.prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { status: 'bot_paused' },
    });

    const agents = await this.prisma.callAgent.findMany({ select: { userId: true } });
    const userIds = agents.map((a) => a.userId);
    await this.dispatch.dispatch({
      ...(userIds.length ? { userIds } : { broadcast: true }),
      type: 'Info',
      title: 'WhatsApp citizen needs an agent',
      body: `${conv.contactName ?? conv.contactMobile}: "${lastMessage.slice(0, 140)}"`,
      link: `/whatsapp?conversation=${conversationId}`,
    });

    const lang = this.detectLanguage(lastMessage);
    return this.reply(
      conversationId,
      'I am connecting you to one of our team members. An agent will reply to you here shortly.',
      lang,
    );
  }

  // ---------- Reply helper ----------

  private async reply(conversationId: string, text: string, lang: 'te' | 'en') {
    let out = text;
    if (lang === 'te') {
      const { text: translated } = await this.translation.translate({ text, to: 'te', from: 'en' });
      out = translated;
    }
    const message = await this.whatsapp.sendMessage(conversationId, out);
    return { replied: true, messageId: message.id };
  }
}
