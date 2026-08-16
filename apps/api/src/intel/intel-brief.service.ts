import { Injectable, NotFoundException } from '@nestjs/common';
import { AiCoreService } from '../ai-core/ai-core.service';
import { TranslationService } from '../ai-core/translation.service';
import { PrismaService } from '../prisma/prisma.service';

/** How many visitor briefs one /visitor-prep/today call will generate on the fly. */
const VISITOR_BRIEF_CAP = 10;

@Injectable()
export class IntelBriefService {
  constructor(
    private prisma: PrismaService,
    private ai: AiCoreService,
    private translation: TranslationService,
  ) {}

  async brief(citizenId: string, refresh = false) {
    if (!refresh) {
      const cached = await this.prisma.citizenBrief.findUnique({ where: { citizenId } });
      if (cached) return cached;
    }
    return this.generate(citizenId);
  }

  /** Today's confirmed appointments plus walk-in visitors, each with a Citizen-360 brief when we can match one. */
  async visitorPrepToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 86400000);

    const [appointments, visitors] = await Promise.all([
      this.prisma.appointmentRequest.findMany({
        where: { status: 'Approved', scheduledAt: { gte: start, lt: end } },
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.visitor.findMany({
        where: { checkInAt: { gte: start, lt: end } },
        orderBy: { checkInAt: 'asc' },
      }),
    ]);

    const entries = [
      ...appointments.map((a) => ({
        kind: 'appointment' as const,
        id: a.id,
        name: a.visitorName,
        mobile: a.mobile,
        purpose: a.purpose,
        at: a.scheduledAt,
      })),
      ...visitors.map((v) => ({
        kind: 'visitor' as const,
        id: v.id,
        name: v.name,
        mobile: v.mobile,
        purpose: v.purpose ?? '',
        at: v.checkInAt,
      })),
    ];

    let generated = 0;
    const items: ((typeof entries)[number] & {
      citizenId: string | null;
      brief: string | null;
      briefTe: string | null;
    })[] = [];
    for (const e of entries) {
      const citizen = e.mobile
        ? await this.prisma.citizen.findFirst({ where: { mobile: e.mobile }, select: { id: true } })
        : null;
      let brief: { brief: string; briefTe: string | null } | null = null;
      if (citizen) {
        const cached = await this.prisma.citizenBrief.findUnique({ where: { citizenId: citizen.id } });
        if (cached) brief = cached;
        else if (generated < VISITOR_BRIEF_CAP) {
          brief = await this.generate(citizen.id);
          generated++;
        }
      }
      items.push({ ...e, citizenId: citizen?.id ?? null, brief: brief?.brief ?? null, briefTe: brief?.briefTe ?? null });
    }

    return { date: start, count: items.length, items };
  }

  private async generate(citizenId: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        name: true,
        mobile: true,
        age: true,
        gender: true,
        occupation: true,
        category: true,
        village: { select: { name: true } },
        mandal: { select: { name: true } },
        booth: { select: { number: true } },
      },
    });
    if (!citizen) throw new NotFoundException('Citizen not found');

    const [grievances, beneficiaries, household, profile, activities, meetingNotes] = await Promise.all([
      this.prisma.grievance.findMany({
        where: { citizenId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { title: true, category: true, status: true, createdAt: true, resolvedAt: true, satisfactionRating: true },
      }),
      this.prisma.beneficiary.findMany({
        where: { citizenId },
        take: 10,
        select: { status: true, disbursedAmount: true, scheme: { select: { name: true } } },
      }),
      this.prisma.d2DHousehold.findFirst({
        where: { citizenId },
        select: {
          headName: true,
          responses: { orderBy: { submittedAt: 'desc' }, take: 3, select: { sentiment: true, issues: true, submittedAt: true } },
          members: { take: 10, select: { name: true, votingPreference: true, issues: true } },
        },
      }),
      this.prisma.voterIntelligenceProfile.findUnique({
        where: { citizenId },
        select: { preference: true, isKeyVoter: true, isInfluencer: true, isSwing: true, priorityScore: true, notes: true },
      }),
      this.prisma.activity.findMany({
        where: { citizenId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { type: true, title: true, status: true, outcome: true, createdAt: true },
      }),
      // MeetingNote has no citizen relation; a name match is the only available link.
      this.prisma.meetingNote.findMany({
        where: { content: { contains: citizen.name, mode: 'insensitive' } },
        orderBy: { meetingDate: 'desc' },
        take: 3,
        select: { title: true, content: true, meetingDate: true },
      }),
    ]);

    // Donations are held against Donor, not Citizen — mobile is the only reliable bridge.
    const donations = citizen.mobile
      ? await this.prisma.donation.findMany({
          where: { donor: { mobile: citizen.mobile } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { amount: true, paymentMode: true, createdAt: true },
        })
      : [];

    const sources = {
      citizen,
      grievances,
      beneficiaries,
      household,
      voterProfile: profile,
      donations: { count: donations.length, total: donations.reduce((s, d) => s + d.amount, 0), recent: donations },
      activities,
      meetingNotes: meetingNotes.map((m) => ({ title: m.title, meetingDate: m.meetingDate })),
    };

    // Round-trip through JSON so Dates become strings and the payload is a plain Prisma Json value.
    const sourcesJson = JSON.parse(JSON.stringify(sources));
    const bullets = this.bulletFallback(citizen.name, sources);
    const ai = await this.ai.completeText({
      system:
        'You brief an Indian MLA before meeting a constituent. Write ONE paragraph (max 120 words), plain text, no headings. ' +
        'Cover who they are, their grievance history and how it was handled, welfare schemes they receive, their political ' +
        'stance/influence, and any recent interactions. State facts from the data only; if something is missing, skip it.',
      user: JSON.stringify(sources),
      maxTokens: 350,
    });

    const brief = ai?.trim() || bullets;
    const briefTe = ai ? (await this.translation.translate({ text: brief, to: 'te', from: 'en' })).text : null;

    return this.prisma.citizenBrief.upsert({
      where: { citizenId },
      create: { citizenId, brief, briefTe, sources: sourcesJson },
      update: { brief, briefTe, sources: sourcesJson, generatedAt: new Date() },
    });
  }

  private bulletFallback(
    name: string,
    s: {
      citizen: { age: number | null; occupation: string | null; village: { name: string } | null; booth: { number: string } | null };
      grievances: { title: string; status: string; resolvedAt: Date | null }[];
      beneficiaries: { status: string; scheme: { name: string } }[];
      household: { responses: { sentiment: string | null }[] } | null;
      voterProfile: { preference: string; isKeyVoter: boolean; isInfluencer: boolean } | null;
      donations: { count: number; total: number };
      activities: { title: string; status: string }[];
    },
  ) {
    const resolved = s.grievances.filter((g) => g.resolvedAt).length;
    const lines = [
      `${name}${s.citizen.age ? `, ${s.citizen.age}` : ''}${s.citizen.occupation ? `, ${s.citizen.occupation}` : ''}` +
        `${s.citizen.village ? ` — ${s.citizen.village.name}` : ''}${s.citizen.booth ? ` (booth ${s.citizen.booth.number})` : ''}`,
      `Grievances: ${s.grievances.length} total, ${resolved} resolved${
        s.grievances[0] ? `; latest "${s.grievances[0].title}" (${s.grievances[0].status})` : ''
      }`,
      `Schemes: ${s.beneficiaries.length ? s.beneficiaries.map((b) => `${b.scheme.name} (${b.status})`).join(', ') : 'none recorded'}`,
      `D2D sentiment: ${s.household?.responses?.[0]?.sentiment ?? 'not surveyed'}`,
      `Voter stance: ${s.voterProfile?.preference ?? 'Unknown'}${s.voterProfile?.isKeyVoter ? ' · key voter' : ''}${
        s.voterProfile?.isInfluencer ? ' · influencer' : ''
      }`,
      `Donations: ${s.donations.count ? `${s.donations.count} totalling ₹${s.donations.total}` : 'none'}`,
      `Recent activity: ${s.activities.length ? s.activities.slice(0, 3).map((a) => `${a.title} (${a.status})`).join('; ') : 'none logged'}`,
    ];
    return lines.map((l) => `• ${l}`).join('\n');
  }
}
