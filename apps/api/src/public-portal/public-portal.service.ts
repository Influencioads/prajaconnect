import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GrievanceChannel } from '@praja/types';
import { createHash, randomInt } from 'crypto';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { SmsAdapter } from '../notifications/channels/sms.adapter';

function hashOtp(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class PublicPortalService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsAdapter,
  ) {}

  async dashboard() {
    const [grievanceCount, feedbackCount, volunteerCount, pendingVolunteers, recentFeedback, recentVolunteers] =
      await Promise.all([
        this.prisma.grievance.count({ where: { channel: GrievanceChannel.Web } }),
        this.prisma.publicFeedback.count(),
        this.prisma.volunteerRegistration.count(),
        this.prisma.volunteerRegistration.count({ where: { status: 'Pending' } }),
        this.prisma.publicFeedback.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.volunteerRegistration.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
      ]);
    return {
      grievanceCount,
      feedbackCount,
      volunteerCount,
      pendingVolunteers,
      recentFeedback,
      recentVolunteers,
    };
  }

  async requestCitizenOtp(mobile: string) {
    const code = String(randomInt(100000, 999999));
    await this.prisma.publicCitizenSession.create({
      data: { mobile, otpHash: hashOtp(code), verified: false },
    });
    const result = await this.sms.send(mobile, `Your PrajaConnect verification code is ${code}.`);
    return {
      success: true,
      message: result.simulated ? 'OTP sent (stub — no SMS gateway configured)' : 'OTP sent via SMS',
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  async verifyCitizenOtp(mobile: string, code: string) {
    const session = await this.prisma.publicCitizenSession.findFirst({
      where: { mobile, otpHash: hashOtp(code), verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) throw new UnauthorizedException('Invalid or expired OTP');
    await this.prisma.publicCitizenSession.update({
      where: { id: session.id },
      data: { verified: true },
    });
    return { sessionId: session.id, mobile, verified: true };
  }

  async submitGrievance(body: {
    title: string;
    description: string;
    category?: string;
    reportedByName?: string;
    reportedByMobile?: string;
    villageId?: string;
    mandalId?: string;
  }) {
    const code = await this.nextGrievanceCode();
    const grievance = await this.prisma.grievance.create({
      data: {
        code,
        title: body.title,
        description: body.description,
        category: body.category,
        channel: GrievanceChannel.Web,
        reportedByName: body.reportedByName,
        reportedByMobile: body.reportedByMobile,
        villageId: body.villageId,
        mandalId: body.mandalId,
        updates: {
          create: {
            action: 'Submitted',
            note: 'Submitted via public portal',
            byName: body.reportedByName ?? 'Public',
          },
        },
      },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });
    return grievance;
  }

  async trackGrievance(ref: string) {
    const grievance = await this.prisma.grievance.findFirst({
      where: { code: { equals: ref, mode: 'insensitive' } },
      select: {
        code: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          select: {
            action: true,
            toStatus: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async listGrievancesAdmin(query: PaginationDto) {
    const { page, limit, search } = query;
    const where: Prisma.GrievanceWhereInput = { channel: GrievanceChannel.Web };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { reportedByName: { contains: search, mode: 'insensitive' } },
        { reportedByMobile: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.grievance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          priority: true,
          reportedByName: true,
          reportedByMobile: true,
          createdAt: true,
        },
      }),
      this.prisma.grievance.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async submitFeedback(body: { name?: string; mobile?: string; message: string }) {
    return this.prisma.publicFeedback.create({ data: body });
  }

  async registerVolunteer(body: { name: string; mobile: string; village?: string }) {
    return this.prisma.volunteerRegistration.create({ data: body });
  }

  async updateVolunteerStatus(id: string, status: 'Approved' | 'Rejected') {
    const found = await this.prisma.volunteerRegistration.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Volunteer registration not found');

    // Approval starts the volunteer lifecycle: one profile per registration, reactivated
    // if the volunteer was previously deactivated.
    if (status === 'Approved') {
      await this.prisma.volunteerProfile.upsert({
        where: { registrationId: id },
        update: { active: true },
        create: { registrationId: id },
      });
    }

    return this.prisma.volunteerRegistration.update({
      where: { id },
      data: { status },
      include: { volunteerProfile: true },
    });
  }

  async registerEvent(body: { eventId: string; name: string; mobile: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event) throw new NotFoundException('Event not found');
    return this.prisma.publicEventRegistration.create({
      data: { eventId: body.eventId, name: body.name, mobile: body.mobile },
      include: { event: { select: { id: true, title: true, startAt: true, venue: true } } },
    });
  }

  async checkSchemeEligibility(params: {
    age?: number;
    income?: number;
    occupation?: string;
    hasSchoolChild?: boolean;
    ownsHouse?: boolean;
  }) {
    const schemes = await this.prisma.scheme.findMany({
      where: { status: 'Active' },
      orderBy: { name: 'asc' },
    });
    const results = schemes.map((scheme) => {
      const rules = (scheme.eligibility ?? {}) as Record<string, unknown>;
      const reasons: string[] = [];
      let eligible = true;

      if (rules.minAge != null && (params.age == null || params.age < Number(rules.minAge))) {
        eligible = false;
        reasons.push(`Minimum age ${rules.minAge} required`);
      }
      if (rules.incomeBelow != null && (params.income == null || params.income > Number(rules.incomeBelow))) {
        eligible = false;
        reasons.push(`Income must be below ₹${rules.incomeBelow}`);
      }
      if (rules.occupation && params.occupation?.toLowerCase() !== String(rules.occupation).toLowerCase()) {
        eligible = false;
        reasons.push(`Occupation must be ${rules.occupation}`);
      }
      if (rules.hasSchoolChild === true && !params.hasSchoolChild) {
        eligible = false;
        reasons.push('Must have a school-going child');
      }
      if (rules.ownsHouse === false && params.ownsHouse === true) {
        eligible = false;
        reasons.push('Must not already own a house');
      }

      return {
        schemeId: scheme.id,
        name: scheme.name,
        code: scheme.code,
        category: scheme.category,
        benefitAmount: scheme.benefitAmount,
        eligible,
        reasons: eligible ? ['Meets eligibility criteria'] : reasons,
      };
    });
    return { schemes: results, eligibleCount: results.filter((r) => r.eligible).length };
  }

  async listFeedback(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.publicFeedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.publicFeedback.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listVolunteers(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { mobile: { contains: search, mode: 'insensitive' as const } },
            { village: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.volunteerRegistration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.volunteerRegistration.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listPublicEvents() {
    return this.prisma.event.findMany({
      where: { status: { in: ['Scheduled', 'Ongoing'] } },
      orderBy: { startAt: 'asc' },
      take: 20,
      select: { id: true, title: true, startAt: true, venue: true, type: true },
    });
  }

  /**
   * Citizen self-booking. Requires a PublicCitizenSession that was OTP-verified for the same mobile.
   * Attaches the caller's grievance/scheme history counts so office staff can triage without a lookup.
   */
  async bookAppointment(body: {
    sessionId: string;
    name: string;
    mobile: string;
    village?: string;
    reason: string;
    category?: string;
  }) {
    const session = await this.prisma.publicCitizenSession.findUnique({ where: { id: body.sessionId } });
    if (!session || !session.verified || session.mobile !== body.mobile) {
      throw new UnauthorizedException('Verify your mobile with an OTP before booking');
    }

    const citizen = await this.prisma.citizen.findFirst({
      where: { mobile: body.mobile },
      select: { id: true, name: true, villageId: true, village: { select: { name: true } } },
    });
    const [grievanceCount, schemeCount] = citizen
      ? await Promise.all([
          this.prisma.grievance.count({ where: { citizenId: citizen.id } }),
          this.prisma.beneficiary.count({ where: { citizenId: citizen.id } }),
        ])
      : [0, 0];

    const appointment = await this.prisma.appointmentRequest.create({
      data: {
        visitorName: body.name,
        mobile: body.mobile,
        purpose: body.reason,
        source: 'public',
        details: {
          category: body.category ?? 'General',
          village: body.village ?? citizen?.village?.name ?? null,
          citizenId: citizen?.id ?? null,
          knownCitizen: Boolean(citizen),
          grievanceCount,
          schemeCount,
        },
      },
      select: { id: true, visitorName: true, status: true, createdAt: true },
    });

    return { ref: appointment.id, ...appointment, grievanceCount, schemeCount };
  }

  async trackAppointment(ref: string) {
    const appointment = await this.prisma.appointmentRequest.findUnique({
      where: { id: ref },
      select: { id: true, visitorName: true, purpose: true, status: true, scheduledAt: true, createdAt: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return { ref: appointment.id, ...appointment };
  }

  private async nextGrievanceCode() {
    const codes = await this.prisma.grievance.findMany({ select: { code: true } });
    let max = 999;
    for (const { code } of codes) {
      const num = parseInt(code.replace(/\D/g, ''), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }
    return `GRV-${max + 1}`;
  }
}
