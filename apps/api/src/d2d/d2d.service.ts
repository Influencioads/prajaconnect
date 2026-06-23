import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ActivityType, ActivityStatus, GrievanceChannel, GrievancePriority } from '@praja/database';
import { D2DSurveyStatus } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { TempGrievancesService } from '../temp-grievances/temp-grievances.service';
import {
  AssignSurveyDto,
  CreateD2DResponseDto,
  CreateD2DSurveyDto,
  CreateFollowupDto,
  ConvertCitizenDto,
  ConvertGrievanceDto,
  D2DAssignmentQueryDto,
  D2DResponseQueryDto,
  D2DSurveyQueryDto,
  SaveQuestionsDto,
  UpdateD2DSurveyDto,
} from './dto/d2d.dto';

@Injectable()
export class D2dService {
  constructor(
    private prisma: PrismaService,
    private tempGrievances: TempGrievancesService,
  ) {}

  async listSurveys(query: D2DSurveyQueryDto) {
    const { page, limit, search, status, type, mandalId, villageId, boothId } = query;
    const where: Prisma.D2DSurveyWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (mandalId) where.targetMandalId = mandalId;
    if (villageId) where.targetVillageId = villageId;
    if (boothId) where.targetBoothId = boothId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameTe: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.d2DSurvey.findMany({
        where,
        include: {
          targetMandal: { select: { id: true, name: true } },
          targetVillage: { select: { id: true, name: true } },
          targetBooth: { select: { id: true, number: true, name: true } },
          _count: { select: { responses: true, assignments: true, questions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.d2DSurvey.count({ where }),
    ]);

    const enriched = await Promise.all(
      data.map(async (s) => {
        const completed = await this.prisma.d2DSurveyResponse.count({ where: { surveyId: s.id } });
        const target = s.targetHouseholds || 1;
        return {
          ...s,
          completedHouseholds: completed,
          pendingHouseholds: Math.max(0, target - completed),
          progressPct: Math.min(100, Math.round((completed / target) * 100)),
        };
      }),
    );

    return { data: enriched, meta: paginate(page, limit, total) };
  }

  async surveyStats() {
    const [
      totalSurveys,
      activeSurveys,
      completedSurveys,
      assignments,
      households,
      responses,
      volunteers,
      sentiments,
      grievances,
    ] = await Promise.all([
      this.prisma.d2DSurvey.count(),
      this.prisma.d2DSurvey.count({ where: { status: 'Active' } }),
      this.prisma.d2DSurvey.count({ where: { status: { in: ['Completed', 'Closed'] } } }),
      this.prisma.d2DSurveyAssignment.count(),
      this.prisma.d2DHousehold.count(),
      this.prisma.d2DSurveyResponse.count(),
      this.prisma.d2DSurveyAssignment.groupBy({ by: ['userId'], _count: true }),
      this.prisma.d2DSurveyResponse.groupBy({ by: ['sentiment'], _count: true, where: { sentiment: { not: null } } }),
      this.prisma.d2DSurveyResponse.count({ where: { grievanceId: { not: null } } }),
    ]);

    const sentimentMap: Record<string, number> = {};
    for (const s of sentiments) {
      if (s.sentiment) sentimentMap[s.sentiment] = s._count;
    }

    const totalTarget = await this.prisma.d2DSurvey.aggregate({ _sum: { targetHouseholds: true } });
    const target = totalTarget._sum.targetHouseholds ?? 0;
    const pendingHouses = Math.max(0, target - households);

    const boothProgress = await this.prisma.d2DHousehold.groupBy({
      by: ['boothId'],
      _count: true,
      where: { boothId: { not: null } },
    });

    const mandalProgress = await this.prisma.d2DHousehold.groupBy({
      by: ['mandalId'],
      _count: true,
      where: { mandalId: { not: null } },
    });

    const issueCounts: Record<string, number> = {};
    const allResponses = await this.prisma.d2DSurveyResponse.findMany({
      select: { issues: true },
      take: 500,
    });
    for (const r of allResponses) {
      const issues = Array.isArray(r.issues) ? (r.issues as string[]) : [];
      for (const issue of issues) {
        issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
      }
    }
    const topIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));

    const supporter = sentimentMap['Supporter'] ?? 0;
    const neutral = sentimentMap['Neutral'] ?? 0;
    const opponent = sentimentMap['Opponent'] ?? 0;
    const totalSentiment = supporter + neutral + opponent || 1;
    const sentimentScore = Math.round(((supporter - opponent) / totalSentiment) * 100);

    return {
      totalSurveys,
      activeSurveys,
      completedSurveys,
      assignedVolunteers: volunteers.length,
      totalHousesCovered: households,
      totalVotersSurveyed: responses,
      pendingHouses,
      sentimentScore,
      supporter,
      neutral,
      opponent,
      grievancesFromSurvey: grievances,
      topIssues,
      boothProgress: boothProgress.map((b) => ({ boothId: b.boothId, covered: b._count })),
      mandalProgress: mandalProgress.map((m) => ({ mandalId: m.mandalId, covered: m._count })),
    };
  }

  async getSurvey(id: string) {
    const survey = await this.prisma.d2DSurvey.findUnique({
      where: { id },
      include: {
        questions: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            cadre: { select: { id: true, name: true, mobile: true } },
          },
        },
        targetMandal: { select: { id: true, name: true } },
        targetVillage: { select: { id: true, name: true } },
        targetBooth: { select: { id: true, number: true, name: true } },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundException('D2D survey not found');
    const completed = survey._count.responses;
    return {
      ...survey,
      completedHouseholds: completed,
      pendingHouseholds: Math.max(0, survey.targetHouseholds - completed),
      progressPct: survey.targetHouseholds
        ? Math.min(100, Math.round((completed / survey.targetHouseholds) * 100))
        : 0,
    };
  }

  async createSurvey(dto: CreateD2DSurveyDto, user: AuthenticatedUser) {
    const { startDate, endDate, ...rest } = dto;
    return this.prisma.d2DSurvey.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: user.id,
      },
    });
  }

  async updateSurvey(id: string, dto: UpdateD2DSurveyDto) {
    await this.ensureSurvey(id);
    const { startDate, endDate, ...rest } = dto;
    return this.prisma.d2DSurvey.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      },
    });
  }

  async deleteSurvey(id: string) {
    await this.ensureSurvey(id);
    await this.prisma.d2DSurvey.delete({ where: { id } });
    return { ok: true };
  }

  async updateSurveyStatus(id: string, status: D2DSurveyStatus) {
    await this.ensureSurvey(id);
    return this.prisma.d2DSurvey.update({ where: { id }, data: { status } });
  }

  async saveQuestions(id: string, dto: SaveQuestionsDto) {
    await this.ensureSurvey(id);
    await this.prisma.d2DSurveyOption.deleteMany({ where: { question: { surveyId: id } } });
    await this.prisma.d2DSurveyQuestion.deleteMany({ where: { surveyId: id } });

    for (const q of dto.questions) {
      await this.prisma.d2DSurveyQuestion.create({
        data: {
          surveyId: id,
          order: q.order,
          type: q.type,
          label: q.label,
          labelTe: q.labelTe,
          required: q.required ?? false,
          config: q.config as Prisma.InputJsonValue,
          options: q.options?.length
            ? {
                create: q.options.map((o) => ({
                  order: o.order,
                  label: o.label,
                  labelTe: o.labelTe,
                  value: o.value,
                })),
              }
            : undefined,
        },
      });
    }
    return this.getSurvey(id);
  }

  async assignSurvey(id: string, dto: AssignSurveyDto) {
    await this.ensureSurvey(id);
    return this.prisma.d2DSurveyAssignment.create({
      data: {
        surveyId: id,
        userId: dto.userId,
        cadreId: dto.cadreId,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        street: dto.street,
        dailyTarget: dto.dailyTarget ?? 10,
      },
      include: {
        user: { select: { id: true, name: true } },
        cadre: { select: { id: true, name: true } },
      },
    });
  }

  async listAssignments(query: D2DAssignmentQueryDto) {
    const { page, limit, surveyId, userId, mandalId, search } = query;
    const where: Prisma.D2DSurveyAssignmentWhereInput = {};
    if (surveyId) where.surveyId = surveyId;
    if (userId) where.userId = userId;
    if (mandalId) where.mandalId = mandalId;
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { cadre: { name: { contains: search, mode: 'insensitive' } } },
        { street: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.d2DSurveyAssignment.findMany({
        where,
        include: {
          survey: { select: { id: true, name: true, status: true } },
          user: { select: { id: true, name: true, mobile: true } },
          cadre: { select: { id: true, name: true, mobile: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.d2DSurveyAssignment.count({ where }),
    ]);

    const leaderboard = await this.prisma.d2DSurveyResponse.groupBy({
      by: ['surveyorUserId'],
      _count: true,
      where: { surveyorUserId: { not: null } },
      orderBy: { _count: { surveyorUserId: 'desc' } },
      take: 10,
    });

    const userIds = leaderboard.map((l) => l.surveyorUserId!).filter(Boolean);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return {
      data,
      meta: paginate(page, limit, total),
      leaderboard: leaderboard.map((l) => ({
        userId: l.surveyorUserId,
        name: userMap.get(l.surveyorUserId!) ?? 'Unknown',
        completed: l._count,
      })),
    };
  }

  async listResponses(query: D2DResponseQueryDto) {
    const { page, limit, search, surveyId, mandalId, villageId, boothId, volunteerId, sentiment, status } = query;
    const where: Prisma.D2DSurveyResponseWhereInput = {};
    if (surveyId) where.surveyId = surveyId;
    if (volunteerId) where.surveyorUserId = volunteerId;
    if (sentiment) where.sentiment = sentiment;
    if (status) where.status = status as never;
    if (mandalId || villageId || boothId) {
      where.household = {};
      if (mandalId) where.household.mandalId = mandalId;
      if (villageId) where.household.villageId = villageId;
      if (boothId) where.household.boothId = boothId;
    }
    if (search) {
      where.OR = [
        { household: { headName: { contains: search, mode: 'insensitive' } } },
        { household: { mobile: { contains: search } } },
        { household: { houseNumber: { contains: search } } },
        { household: { members: { some: { voterId: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.d2DSurveyResponse.findMany({
        where,
        include: {
          survey: { select: { id: true, name: true, type: true } },
          household: {
            include: {
              village: { select: { name: true } },
              booth: { select: { number: true } },
              members: { take: 3 },
            },
          },
          surveyorUser: { select: { id: true, name: true } },
          _count: { select: { photos: true, answers: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.d2DSurveyResponse.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  async getResponse(id: string) {
    const response = await this.prisma.d2DSurveyResponse.findUnique({
      where: { id },
      include: {
        survey: { include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } } },
        household: { include: { members: true, village: true, booth: true, mandal: true } },
        surveyorUser: { select: { id: true, name: true, mobile: true } },
        surveyorCadre: { select: { id: true, name: true } },
        answers: { include: { question: true } },
        photos: true,
        locations: true,
        followups: true,
        grievance: { select: { id: true, code: true, title: true } },
        activity: { select: { id: true, title: true, status: true } },
      },
    });
    if (!response) throw new NotFoundException('Response not found');
    return response;
  }

  async createResponse(dto: CreateD2DResponseDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      let householdId = dto.householdId;

      if (dto.household) {
        const h = dto.household;
        const household = await tx.d2DHousehold.create({
          data: {
            houseNumber: h.houseNumber,
            headName: h.headName,
            mobile: h.mobile,
            whatsapp: h.whatsapp,
            address: h.address,
            ward: h.ward,
            street: h.street,
            mandalId: h.mandalId,
            villageId: h.villageId,
            boothId: h.boothId,
            latitude: h.latitude,
            longitude: h.longitude,
            surveyedById: user.id,
            members: h.members?.length
              ? {
                  create: h.members.map((m) => ({
                    name: m.name,
                    age: m.age,
                    gender: m.gender as never,
                    voterId: m.voterId,
                    mobile: m.mobile,
                    occupation: m.occupation,
                    education: m.education,
                    votingPreference: m.votingPreference,
                    schemeBenefits: m.schemeBenefits as Prisma.InputJsonValue,
                    issues: m.issues as Prisma.InputJsonValue,
                  })),
                }
              : undefined,
          },
        });
        householdId = household.id;
      }

      const response = await tx.d2DSurveyResponse.create({
        data: {
          surveyId: dto.surveyId,
          householdId,
          surveyorUserId: user.id,
          sentiment: dto.sentiment,
          priority: dto.priority,
          needsFollowup: dto.needsFollowup ?? false,
          isKeyVoter: dto.isKeyVoter ?? false,
          influencer: dto.influencer ?? false,
          issues: dto.issues as Prisma.InputJsonValue,
          timeTakenSec: dto.timeTakenSec,
          latitude: dto.latitude,
          longitude: dto.longitude,
          status: 'Synced',
          answers: dto.answers?.length
            ? {
                create: dto.answers.map((a) => ({
                  questionId: a.questionId,
                  value: a.value as Prisma.InputJsonValue,
                })),
              }
            : undefined,
          photos: dto.photos?.length
            ? { create: dto.photos.map((p) => ({ url: p.url, label: p.label })) }
            : undefined,
        },
        include: { household: true, answers: true },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = await tx.d2DVolunteerTarget.findFirst({
        where: { surveyId: dto.surveyId, userId: user.id, date: today },
      });
      if (target) {
        await tx.d2DVolunteerTarget.update({
          where: { id: target.id },
          data: { completed: { increment: 1 } },
        });
      }

      return response;
    }).then(async (response) => {
      await this.tempGrievances.tryAutoCreateFromD2dResponse(response.id, user).catch(() => undefined);
      return response;
    });
  }

  async convertToGrievance(id: string, dto: ConvertGrievanceDto, user: AuthenticatedUser) {
    const response = await this.getResponse(id);
    if (response.grievanceId) return { grievanceId: response.grievanceId, existing: true };

    const household = response.household;
    const issues = Array.isArray(response.issues) ? (response.issues as string[]) : [];
    const title = dto.title ?? `Survey grievance - ${household?.headName ?? 'Citizen'}`;
    const description =
      dto.description ??
      `Created from D2D survey. Issues: ${issues.join(', ') || 'Not specified'}. Sentiment: ${response.sentiment ?? 'N/A'}.`;

    const code = `GRV-D2D-${Date.now().toString(36).toUpperCase()}`;
    const grievance = await this.prisma.grievance.create({
      data: {
        code,
        title,
        description,
        category: dto.category ?? issues[0] ?? 'Other',
        channel: GrievanceChannel.Field,
        priority: GrievancePriority.Medium,
        reportedByName: household?.headName,
        reportedByMobile: household?.mobile,
        villageId: household?.villageId,
        mandalId: household?.mandalId,
        address: household?.address,
        latitude: response.latitude ?? household?.latitude,
        longitude: response.longitude ?? household?.longitude,
        createdById: user.id,
      },
    });

    await this.prisma.d2DSurveyResponse.update({
      where: { id },
      data: { grievanceId: grievance.id },
    });

    return { grievanceId: grievance.id, code: grievance.code };
  }

  async convertToCitizen(id: string, dto: ConvertCitizenDto) {
    const response = await this.getResponse(id);
    const household = response.household;
    if (!household) throw new NotFoundException('No household linked');

    let familyId = household.familyId;
    if (dto.createFamily && !familyId) {
      const family = await this.prisma.family.create({
        data: {
          headName: household.headName,
          address: household.address,
          villageId: household.villageId,
          boothId: household.boothId,
        },
      });
      familyId = family.id;
      await this.prisma.d2DHousehold.update({ where: { id: household.id }, data: { familyId } });
    }

    const citizen = await this.prisma.citizen.create({
      data: {
        name: household.headName,
        mobile: household.mobile,
        address: household.address,
        villageId: household.villageId,
        boothId: household.boothId,
        mandalId: household.mandalId,
        familyId,
        isFamilyHead: true,
      },
    });

    await this.prisma.d2DHousehold.update({ where: { id: household.id }, data: { citizenId: citizen.id } });

    for (const member of household.members) {
      if (!member.citizenId) {
        const c = await this.prisma.citizen.create({
          data: {
            name: member.name,
            mobile: member.mobile,
            age: member.age,
            gender: member.gender,
            voterId: member.voterId,
            occupation: member.occupation,
            villageId: household.villageId,
            boothId: household.boothId,
            mandalId: household.mandalId,
            familyId,
          },
        });
        await this.prisma.d2DFamilyMember.update({ where: { id: member.id }, data: { citizenId: c.id } });
      }
    }

    return { citizenId: citizen.id, familyId };
  }

  async createFollowup(id: string, dto: CreateFollowupDto, user: AuthenticatedUser) {
    const response = await this.getResponse(id);
    const household = response.household;

    const activity = await this.prisma.activity.create({
      data: {
        type: ActivityType.Task,
        title: `D2D Follow-up: ${household?.headName ?? 'Household'}`,
        description: dto.note ?? `Follow-up from survey response ${id}`,
        status: ActivityStatus.Planned,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        assignedToUserId: dto.assignedToUserId ?? user.id,
        createdById: user.id,
        mandalId: household?.mandalId,
        villageId: household?.villageId,
        boothId: household?.boothId,
      },
    });

    const followup = await this.prisma.d2DFollowup.create({
      data: {
        responseId: id,
        type: 'Task',
        note: dto.note,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        assignedToUserId: dto.assignedToUserId ?? user.id,
        activityId: activity.id,
      },
    });

    await this.prisma.d2DSurveyResponse.update({
      where: { id },
      data: { activityId: activity.id, needsFollowup: true },
    });

    return { followupId: followup.id, activityId: activity.id };
  }

  async listHouseholds(query: D2DResponseQueryDto) {
    const { page, limit, search, mandalId, villageId, boothId } = query;
    const where: Prisma.D2DHouseholdWhereInput = {};
    if (mandalId) where.mandalId = mandalId;
    if (villageId) where.villageId = villageId;
    if (boothId) where.boothId = boothId;
    if (search) {
      where.OR = [
        { headName: { contains: search, mode: 'insensitive' } },
        { houseNumber: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.d2DHousehold.findMany({
        where,
        include: {
          village: { select: { name: true } },
          booth: { select: { number: true } },
          mandal: { select: { name: true } },
          members: true,
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.d2DHousehold.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  async myAssignments(userId: string) {
    const assignments = await this.prisma.d2DSurveyAssignment.findMany({
      where: { userId, status: 'Active' },
      include: {
        survey: {
          include: {
            questions: { include: { options: true }, orderBy: { order: 'asc' } },
            targetMandal: { select: { name: true } },
            targetVillage: { select: { name: true } },
            targetBooth: { select: { number: true } },
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targets = await this.prisma.d2DVolunteerTarget.findMany({
      where: { userId, date: today },
    });

    const completedToday = await this.prisma.d2DSurveyResponse.count({
      where: {
        surveyorUserId: userId,
        submittedAt: { gte: today },
      },
    });

    return { assignments, targets, completedToday };
  }

  private async ensureSurvey(id: string) {
    const found = await this.prisma.d2DSurvey.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('D2D survey not found');
  }
}
