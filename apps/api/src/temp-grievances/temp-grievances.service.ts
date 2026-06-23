import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ActivityType } from '@praja/database';
import {
  GrievanceChannel,
  GrievancePriority,
  TempGrievanceSource,
  TempGrievanceStatus,
  UserRole,
} from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { TempGrievancesAiService } from './temp-grievances-ai.service';
import { GrievanceSlaService } from '../grievances/grievance-sla.service';
import {
  AddTempGrievanceNoteDto,
  ArchiveTempGrievanceDto,
  AssignValidatorDto,
  ConvertTempGrievanceDto,
  CreateTempGrievanceDto,
  FromCallDto,
  FromD2dSurveyDto,
  FromEmailDto,
  FromFieldVisitDto,
  FromWhatsappDto,
  MarkDuplicateDto,
  MergeTempGrievanceDto,
  RejectTempGrievanceDto,
  RequestMoreInfoDto,
  TempGrievanceQueryDto,
  UpdateTempGrievanceDto,
  ValidateTempGrievanceDto,
} from './dto/temp-grievance.dto';

const listInclude = {
  citizen: { select: { id: true, name: true, mobile: true } },
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  assignedValidator: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  convertedGrievance: { select: { id: true, code: true } },
} satisfies Prisma.TemporaryGrievanceInclude;

const detailInclude = {
  ...listInclude,
  media: { orderBy: { createdAt: 'desc' as const } },
  notes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' as const } },
  validationLogs: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' as const } },
  duplicates: { orderBy: { matchScore: 'desc' as const } },
  whatsappConversation: { select: { id: true, contactName: true, contactMobile: true } },
  d2dSurveyResponse: { select: { id: true, issues: true, sentiment: true } },
} satisfies Prisma.TemporaryGrievanceInclude;

const SYSTEM_USER: AuthenticatedUser = {
  id: 'system',
  name: 'System',
  email: 'system@praja.in',
  mobile: '0000000000',
  role: UserRole.Volunteer,
  roleLabel: 'System',
  rank: 0,
  language: 'en',
  permissions: [],
};

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapActivityTypeToSource(type: ActivityType): TempGrievanceSource {
  const map: Partial<Record<ActivityType, TempGrievanceSource>> = {
    Call: TempGrievanceSource.Call,
    CampaignCall: TempGrievanceSource.CampaignCall,
    ConferenceCall: TempGrievanceSource.ConferenceCall,
    Email: TempGrievanceSource.Email,
    SmsCampaign: TempGrievanceSource.SMS,
    Meeting: TempGrievanceSource.FieldVisit,
    Visit: TempGrievanceSource.FieldVisit,
    FieldVisit: TempGrievanceSource.FieldVisit,
    Task: TempGrievanceSource.VolunteerNote,
    WhatsApp: TempGrievanceSource.WhatsApp,
  };
  return map[type] ?? TempGrievanceSource.Manual;
}

@Injectable()
export class TempGrievancesService {
  constructor(
    private prisma: PrismaService,
    private ai: TempGrievancesAiService,
    private sla: GrievanceSlaService,
  ) {}

  async list(query: TempGrievanceQueryDto, user?: AuthenticatedUser) {
    const { page, limit, search, source, status, priority, mandalId, villageId, assignedValidatorId, duplicateRisk, issueCategory, from, to, scope } = query;
    const where: Prisma.TemporaryGrievanceWhereInput = {};

    if (source) where.source = source;
    if (status) where.validationStatus = status;
    if (priority) where.priority = priority;
    if (mandalId) where.mandalId = mandalId;
    if (villageId) where.villageId = villageId;
    if (assignedValidatorId) where.assignedValidatorId = assignedValidatorId;
    if (issueCategory) where.issueCategory = issueCategory;
    if (duplicateRisk) where.duplicateRisk = duplicateRisk as never;
    if (scope === 'me' && user) where.assignedValidatorId = user.id;

    const fromDate = toDate(from);
    const toDateVal = toDate(to);
    if (fromDate || toDateVal) {
      where.createdAt = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDateVal ? { lte: toDateVal } : {}),
      };
    }

    if (search) {
      const term = { contains: search, mode: 'insensitive' as const };
      where.OR = [
        { citizenName: term },
        { mobileNumber: term },
        { tempTicketId: term },
        { issueSummary: term },
        { issueDescription: term },
        { village: { name: term } },
        { mandal: { name: term } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.temporaryGrievance.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.temporaryGrievance.count({ where }),
    ]);

    const now = new Date();
    return {
      data: data.map((row) => this.sla.enrichTempRow(row, now)),
      meta: paginate(page, limit, total),
    };
  }

  async analytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      total,
      pendingValidation,
      validatedToday,
      converted,
      rejected,
      duplicateSuspected,
      bySource,
      byPriority,
      byMandal,
      byVillage,
    ] = await Promise.all([
      this.prisma.temporaryGrievance.count(),
      this.prisma.temporaryGrievance.count({
        where: { validationStatus: { in: ['New', 'PendingValidation', 'MoreInfoRequired'] } },
      }),
      this.prisma.temporaryGrievance.count({
        where: { validationStatus: 'Validated', updatedAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.temporaryGrievance.count({ where: { validationStatus: 'Converted' } }),
      this.prisma.temporaryGrievance.count({ where: { validationStatus: { in: ['Rejected', 'Archived'] } } }),
      this.prisma.temporaryGrievance.count({ where: { duplicateRisk: { in: ['Medium', 'High'] } } }),
      this.prisma.temporaryGrievance.groupBy({ by: ['source'], _count: { _all: true } }),
      this.prisma.temporaryGrievance.groupBy({ by: ['priority'], _count: { _all: true } }),
      this.prisma.temporaryGrievance.groupBy({ by: ['mandalId'], _count: { _all: true }, where: { mandalId: { not: null } } }),
      this.prisma.temporaryGrievance.groupBy({ by: ['villageId'], _count: { _all: true }, where: { villageId: { not: null } } }),
    ]);

    const mandalIds = byMandal.map((m) => m.mandalId!).filter(Boolean);
    const villageIds = byVillage.map((v) => v.villageId!).filter(Boolean);
    const [mandals, villages] = await Promise.all([
      mandalIds.length ? this.prisma.mandal.findMany({ where: { id: { in: mandalIds } }, select: { id: true, name: true } }) : [] as { id: string; name: string }[],
      villageIds.length ? this.prisma.village.findMany({ where: { id: { in: villageIds } }, select: { id: true, name: true } }) : [] as { id: string; name: string }[],
    ]);

    return {
      total,
      pendingValidation,
      validatedToday,
      converted,
      rejectedSpam: rejected,
      duplicateSuspected,
      bySource: Object.fromEntries(bySource.map((s) => [s.source, s._count._all])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count._all])),
      byMandal: byMandal.map((m) => ({
        mandalId: m.mandalId,
        name: mandals.find((x) => x.id === m.mandalId)?.name ?? 'Unknown',
        count: m._count._all,
      })),
      byVillage: byVillage.map((v) => ({
        villageId: v.villageId,
        name: villages.find((x) => x.id === v.villageId)?.name ?? 'Unknown',
        count: v._count._all,
      })),
    };
  }

  async get(id: string) {
    const item = await this.prisma.temporaryGrievance.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!item) throw new NotFoundException('Temporary grievance not found');
    return item;
  }

  async create(dto: CreateTempGrievanceDto, user: AuthenticatedUser) {
    const tempTicketId = await this.nextTicketId();
    const text = dto.issueDescription ?? dto.originalMessage ?? dto.issueSummary ?? '';
    const category = dto.issueCategory ?? (text ? this.ai.extractIssueCategory(text).category : 'Other');
    const priority = dto.priority ?? (text ? this.ai.predictPriority(text) : 'Medium');

    const validationDueAt = await this.sla.computeValidationDueAt();

    const item = await this.prisma.temporaryGrievance.create({
      data: {
        ...dto,
        tempTicketId,
        issueCategory: category,
        priority: priority as never,
        validationStatus: 'PendingValidation',
        validationDueAt,
        createdById: user.id,
        validationLogs: {
          create: {
            validationAction: 'Created',
            newStatus: 'PendingValidation',
            remarks: `Manually created from ${dto.source}`,
            createdById: user.id,
          },
        },
      },
      include: listInclude,
    });

    await this.runDuplicateDetection(item.id);
    return this.get(item.id);
  }

  async update(id: string, dto: UpdateTempGrievanceDto) {
    await this.ensureExists(id);
    return this.prisma.temporaryGrievance.update({
      where: { id },
      data: { ...dto },
      include: listInclude,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.temporaryGrievance.delete({ where: { id } });
    return { success: true };
  }

  async validate(id: string, dto: ValidateTempGrievanceDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    return this.transition(id, item.validationStatus, TempGrievanceStatus.Validated, 'Validated', dto.remarks ?? 'Validation checklist completed', user, {
      validationChecklist: dto.checklist,
    });
  }

  async convert(id: string, dto: ConvertTempGrievanceDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    if (item.validationStatus === 'Converted') {
      throw new BadRequestException('Already converted');
    }

    const title = dto.title ?? item.issueSummary ?? `Grievance from ${item.source}`;
    const description = dto.description ?? item.issueDescription ?? item.originalMessage ?? title;
    const category = dto.category ?? item.issueCategory ?? 'Other';
    const priority = this.mapPriority(dto.priority ?? item.priority);

    if (!dto.departmentId && category) {
      const rec = this.ai.recommendDepartment(category);
      const dept = await this.prisma.department.findFirst({ where: { name: rec.departmentName } });
      if (dept) dto.departmentId = dept.id;
    }

    const { slaDays, slaDueAt } = await this.sla.resolveResolutionSla({
      slaDays: dto.slaDays,
      departmentId: dto.departmentId,
      priority,
    });

    const code = await this.nextGrievanceCode();
    const channel = this.mapSourceToChannel(item.source);

    const grievance = await this.prisma.grievance.create({
      data: {
        code,
        title,
        description,
        category,
        channel,
        priority,
        status: dto.departmentId ? 'Assigned' : 'Open',
        citizenId: item.citizenId,
        reportedByName: item.citizenName,
        reportedByMobile: item.mobileNumber ?? item.whatsappNumber,
        departmentId: dto.departmentId,
        assignedOfficialId: dto.assignedOfficialId,
        assignedCadreId: dto.assignedCadreId,
        villageId: item.villageId,
        mandalId: item.mandalId,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        slaDays,
        slaDueAt,
        createdById: user.id,
        convertedFromTempId: item.id,
        updates: {
          create: {
            action: 'Created',
            toStatus: dto.departmentId ? 'Assigned' : 'Open',
            note: `Converted from temp grievance ${item.tempTicketId}`,
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
    });

    await this.prisma.temporaryGrievance.update({
      where: { id },
      data: {
        validationStatus: 'Converted',
        convertedGrievanceId: grievance.id,
        convertedAt: new Date(),
        validationLogs: {
          create: {
            validationAction: 'Converted',
            oldStatus: item.validationStatus,
            newStatus: 'Converted',
            remarks: `Converted to ${grievance.code}`,
            createdById: user.id,
          },
        },
      },
    });

    await this.sla.resolveValidationViolation(id);

    if (dto.notifyCitizen !== false && (item.mobileNumber || item.whatsappNumber)) {
      // Stub notification — real WhatsApp/SMS provider integration pending
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: 'Info',
          title: 'Citizen notification queued',
          body: `Grievance ${grievance.code} registered. Citizen will be notified via WhatsApp/SMS.`,
        },
      });
    }

    return { grievanceId: grievance.id, code: grievance.code, tempTicketId: item.tempTicketId };
  }

  async reject(id: string, dto: RejectTempGrievanceDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    return this.transition(id, item.validationStatus, TempGrievanceStatus.Rejected, 'Rejected', dto.reason, user, { rejectedReason: dto.reason });
  }

  async archive(id: string, dto: ArchiveTempGrievanceDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    return this.transition(id, item.validationStatus, TempGrievanceStatus.Archived, 'Archived', dto.reason, user, { archivedReason: dto.reason });
  }

  async markDuplicate(id: string, dto: MarkDuplicateDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    if (dto.matchedGrievanceId || dto.matchedTempId) {
      await this.prisma.temporaryGrievanceDuplicate.create({
        data: {
          temporaryGrievanceId: id,
          matchedGrievanceId: dto.matchedGrievanceId,
          matchedTempId: dto.matchedTempId,
          matchScore: 100,
          matchReason: dto.remarks ?? 'Marked as duplicate by validator',
          actionTaken: 'MarkedDuplicate',
        },
      });
    }
    return this.transition(id, item.validationStatus, TempGrievanceStatus.Duplicate, 'MarkDuplicate', dto.remarks ?? 'Marked as duplicate', user);
  }

  async merge(id: string, dto: MergeTempGrievanceDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    const target = await this.prisma.grievance.findUnique({ where: { id: dto.targetGrievanceId } });
    if (!target) throw new NotFoundException('Target grievance not found');

    await this.prisma.temporaryGrievanceDuplicate.create({
      data: {
        temporaryGrievanceId: id,
        matchedGrievanceId: dto.targetGrievanceId,
        matchScore: 100,
        matchReason: dto.remarks ?? 'Merged with existing grievance',
        actionTaken: 'Merged',
      },
    });

    await this.prisma.grievanceUpdate.create({
      data: {
        grievanceId: dto.targetGrievanceId,
        action: 'MergedTempGrievance',
        note: `Merged temp grievance ${item.tempTicketId}: ${item.issueSummary ?? item.issueDescription ?? ''}`,
        byUserId: user.id,
        byName: user.name,
      },
    });

    return this.transition(id, item.validationStatus, TempGrievanceStatus.Duplicate, 'Merge', dto.remarks ?? `Merged with ${target.code}`, user);
  }

  async requestMoreInfo(id: string, dto: RequestMoreInfoDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    await this.addNote(id, { note: `More info requested: ${dto.message}` }, user);
    return this.transition(id, item.validationStatus, TempGrievanceStatus.MoreInfoRequired, 'RequestMoreInfo', dto.message, user);
  }

  async assignValidator(id: string, dto: AssignValidatorDto, user: AuthenticatedUser) {
    const item = await this.get(id);
    const nextStatus = item.validationStatus === 'New' ? 'PendingValidation' : item.validationStatus;
    return this.prisma.temporaryGrievance.update({
      where: { id },
      data: {
        assignedValidatorId: dto.validatorId,
        validationStatus: nextStatus,
        validationLogs: {
          create: {
            validationAction: 'AssignValidator',
            oldStatus: item.validationStatus,
            newStatus: nextStatus,
            remarks: dto.note ?? 'Assigned to validator',
            createdById: user.id,
          },
        },
      },
      include: listInclude,
    });
  }

  async addNote(id: string, dto: AddTempGrievanceNoteDto, user: AuthenticatedUser) {
    await this.ensureExists(id);
    return this.prisma.temporaryGrievanceNote.create({
      data: { temporaryGrievanceId: id, note: dto.note, createdById: user.id },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async getDuplicates(id: string) {
    await this.ensureExists(id);
    const item = await this.get(id);
    const matches = await this.findDuplicateMatches(item);
    return { tempGrievanceId: id, matches };
  }

  async fromCall(dto: FromCallDto, user: AuthenticatedUser) {
    return this.fromActivity(dto.activityId, user);
  }

  async fromEmail(dto: FromEmailDto, user: AuthenticatedUser) {
    return this.fromActivity(dto.activityId, user);
  }

  async fromFieldVisit(dto: FromFieldVisitDto, user: AuthenticatedUser) {
    return this.fromActivity(dto.activityId, user);
  }

  async fromWhatsapp(dto: FromWhatsappDto, user: AuthenticatedUser) {
    const conv = await this.prisma.whatsappConversation.findUnique({
      where: { id: dto.conversationId },
      include: {
        citizen: true,
        messages: dto.messageId
          ? { where: { id: dto.messageId } }
          : { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const message = conv.messages[0];
    const text = message?.body ?? '';
    return this.autoCreateFromText({
      source: TempGrievanceSource.WhatsApp,
      sourceReferenceId: dto.messageId ?? conv.id,
      text,
      citizenId: conv.citizenId ?? undefined,
      citizenName: conv.citizen?.name ?? conv.contactName ?? undefined,
      mobileNumber: conv.contactMobile,
      whatsappNumber: conv.contactMobile,
      whatsappConversationId: conv.id,
      whatsappChatUrl: `/whatsapp?conversation=${conv.id}`,
      user,
    });
  }

  async fromD2dSurvey(dto: FromD2dSurveyDto, user: AuthenticatedUser) {
    const response = await this.prisma.d2DSurveyResponse.findUnique({
      where: { id: dto.responseId },
      include: { household: true, photos: true },
    });
    if (!response) throw new NotFoundException('D2D response not found');

    const issues = Array.isArray(response.issues) ? (response.issues as string[]) : [];
    const text = issues.join(', ');
    const household = response.household;

    return this.autoCreateFromText({
      source: TempGrievanceSource.D2DSurvey,
      sourceReferenceId: response.id,
      text: text || 'Survey issue reported',
      citizenName: household?.headName ?? undefined,
      mobileNumber: household?.mobile ?? undefined,
      whatsappNumber: household?.whatsapp ?? undefined,
      mandalId: household?.mandalId ?? undefined,
      villageId: household?.villageId ?? undefined,
      boothId: household?.boothId ?? undefined,
      wardId: household?.ward ?? undefined,
      address: household?.address ?? undefined,
      latitude: response.latitude ?? household?.latitude ?? undefined,
      longitude: response.longitude ?? household?.longitude ?? undefined,
      d2dSurveyResponseId: response.id,
      user,
      media: response.photos?.map((p) => ({ mediaType: 'photo', mediaUrl: p.url, fileName: p.label ?? undefined })),
    });
  }

  async tryAutoCreateFromActivity(activityId: string, user?: AuthenticatedUser) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { citizen: true, notes: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });
    if (!activity) return null;

    const noteText = activity.notes.map((n) => n.note).join(' ');
    const text = [activity.title, activity.description, activity.outcome, noteText].filter(Boolean).join(' ');
    const intent = this.ai.detectComplaintIntent(text);
    if (!intent.isComplaint) return null;

    const existing = await this.prisma.temporaryGrievance.findFirst({
      where: { sourceReferenceId: activityId },
    });
    if (existing) return existing;

    return this.autoCreateFromText({
      source: mapActivityTypeToSource(activity.type),
      sourceReferenceId: activity.id,
      text,
      citizenId: activity.citizenId ?? undefined,
      citizenName: activity.citizen?.name ?? activity.contactName ?? undefined,
      mobileNumber: activity.citizen?.mobile ?? activity.contactMobile ?? undefined,
      mandalId: activity.mandalId ?? undefined,
      villageId: activity.villageId ?? undefined,
      boothId: activity.boothId ?? undefined,
      address: activity.locationName ?? undefined,
      latitude: activity.latitude ?? undefined,
      longitude: activity.longitude ?? undefined,
      voiceRecordingUrl: activity.recordingUrl ?? undefined,
      user: user ?? SYSTEM_USER,
    });
  }

  async tryAutoCreateFromD2dResponse(responseId: string, user: AuthenticatedUser) {
    const response = await this.prisma.d2DSurveyResponse.findUnique({
      where: { id: responseId },
      include: { household: true },
    });
    if (!response) return null;

    const issues = Array.isArray(response.issues) ? (response.issues as string[]) : [];
    const text = issues.join(', ');
    if (!text && !response.needsFollowup) return null;

    const intent = text ? this.ai.detectComplaintIntent(text) : { isComplaint: response.needsFollowup };
    if (!intent.isComplaint) return null;

    const existing = await this.prisma.temporaryGrievance.findFirst({
      where: { d2dSurveyResponseId: responseId },
    });
    if (existing) return existing;

    return this.fromD2dSurvey({ responseId }, user);
  }

  async tryAutoCreateFromWhatsappMessage(conversationId: string, messageBody: string, messageId?: string) {
    const intent = this.ai.detectComplaintIntent(messageBody);
    if (!intent.isComplaint) return null;

    const existing = await this.prisma.temporaryGrievance.findFirst({
      where: { sourceReferenceId: messageId ?? conversationId, source: 'WhatsApp' },
    });
    if (existing) return existing;

    return this.fromWhatsapp({ conversationId, messageId }, { ...SYSTEM_USER, name: 'WhatsApp Bot' });
  }

  private async fromActivity(activityId: string, user: AuthenticatedUser) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { citizen: true, notes: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const noteText = activity.notes.map((n) => n.note).join(' ');
    const text = [activity.title, activity.description, activity.outcome, noteText].filter(Boolean).join(' ');

    return this.autoCreateFromText({
      source: mapActivityTypeToSource(activity.type),
      sourceReferenceId: activity.id,
      text,
      citizenId: activity.citizenId ?? undefined,
      citizenName: activity.citizen?.name ?? activity.contactName ?? undefined,
      mobileNumber: activity.citizen?.mobile ?? activity.contactMobile ?? undefined,
      mandalId: activity.mandalId ?? undefined,
      villageId: activity.villageId ?? undefined,
      boothId: activity.boothId ?? undefined,
      address: activity.locationName ?? undefined,
      latitude: activity.latitude ?? undefined,
      longitude: activity.longitude ?? undefined,
      voiceRecordingUrl: activity.recordingUrl ?? undefined,
      user,
    });
  }

  private async autoCreateFromText(opts: {
    source: TempGrievanceSource;
    sourceReferenceId: string;
    text: string;
    citizenId?: string;
    citizenName?: string;
    mobileNumber?: string;
    whatsappNumber?: string;
    mandalId?: string;
    villageId?: string;
    boothId?: string;
    wardId?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    voiceRecordingUrl?: string;
    whatsappChatUrl?: string;
    whatsappConversationId?: string;
    d2dSurveyResponseId?: string;
    user: AuthenticatedUser;
    media?: { mediaType: string; mediaUrl: string; fileName?: string }[];
  }) {
    const { translated } = this.ai.translateTeluguToEnglish(opts.text);
    const category = this.ai.extractIssueCategory(translated).category;
    const priority = this.ai.predictPriority(translated);
    const summary = this.ai.generateSummary(translated);
    const tempTicketId = await this.nextTicketId();
    const validationDueAt = await this.sla.computeValidationDueAt();

    const item = await this.prisma.temporaryGrievance.create({
      data: {
        tempTicketId,
        source: opts.source,
        sourceReferenceId: opts.sourceReferenceId,
        citizenId: opts.citizenId,
        citizenName: opts.citizenName,
        mobileNumber: opts.mobileNumber,
        whatsappNumber: opts.whatsappNumber,
        mandalId: opts.mandalId,
        villageId: opts.villageId,
        boothId: opts.boothId,
        wardId: opts.wardId,
        address: opts.address,
        latitude: opts.latitude,
        longitude: opts.longitude,
        issueCategory: category,
        issueSummary: summary,
        issueDescription: translated,
        originalMessage: opts.text,
        priority: priority as never,
        validationStatus: 'PendingValidation',
        validationDueAt,
        voiceRecordingUrl: opts.voiceRecordingUrl,
        whatsappChatUrl: opts.whatsappChatUrl,
        whatsappConversationId: opts.whatsappConversationId,
        d2dSurveyResponseId: opts.d2dSurveyResponseId,
        createdById: opts.user.id !== 'system' ? opts.user.id : undefined,
        validationLogs: {
          create: {
            validationAction: 'AutoCreated',
            newStatus: 'PendingValidation',
            remarks: `Auto-created from ${opts.source}`,
            createdById: opts.user.id !== 'system' ? opts.user.id : undefined,
          },
        },
        media: opts.media?.length
          ? { create: opts.media.map((m) => ({ ...m, uploadedById: opts.user.id !== 'system' ? opts.user.id : undefined })) }
          : undefined,
      },
      include: listInclude,
    });

    await this.runDuplicateDetection(item.id);
    return this.get(item.id);
  }

  async runDuplicateDetection(id: string) {
    const item = await this.get(id);
    const matches = await this.findDuplicateMatches(item);

    const topScore = matches[0]?.matchScore ?? 0;
    const duplicateRisk = topScore >= 70 ? 'High' : topScore >= 40 ? 'Medium' : topScore > 0 ? 'Low' : 'None';

    await this.prisma.temporaryGrievanceDuplicate.deleteMany({ where: { temporaryGrievanceId: id } });
    if (matches.length) {
      await this.prisma.temporaryGrievanceDuplicate.createMany({
        data: matches.slice(0, 5).map((m) => ({
          temporaryGrievanceId: id,
          matchedGrievanceId: m.grievanceId,
          matchedTempId: m.tempId,
          matchScore: m.matchScore,
          matchReason: m.matchReason,
        })),
      });
    }

    await this.prisma.temporaryGrievance.update({
      where: { id },
      data: { duplicateRiskScore: topScore, duplicateRisk: duplicateRisk as never },
    });

    return matches;
  }

  private async findDuplicateMatches(item: {
    id: string;
    mobileNumber?: string | null;
    citizenName?: string | null;
    villageId?: string | null;
    mandalId?: string | null;
    issueCategory?: string | null;
    issueDescription?: string | null;
    issueSummary?: string | null;
    source?: string;
    createdAt?: Date;
  }) {
    const text = item.issueDescription ?? item.issueSummary ?? '';
    const matches: { grievanceId?: string; tempId?: string; ticketId: string; matchScore: number; matchReason: string }[] = [];

    if (item.mobileNumber) {
      const [grievances, temps] = await Promise.all([
        this.prisma.grievance.findMany({
          where: {
            reportedByMobile: item.mobileNumber,
            status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] },
          },
          take: 5,
        }),
        this.prisma.temporaryGrievance.findMany({
          where: {
            mobileNumber: item.mobileNumber,
            id: { not: item.id },
            validationStatus: { notIn: ['Converted', 'Rejected', 'Archived'] },
          },
          take: 5,
        }),
      ]);

      for (const g of grievances) {
        const textScore = this.ai.scoreDuplicateSimilarity(text, g.description);
        matches.push({
          grievanceId: g.id,
          ticketId: g.code,
          matchScore: Math.min(100, 50 + textScore * 0.5),
          matchReason: 'Same mobile + similar issue',
        });
      }
      for (const t of temps) {
        const tText = t.issueDescription ?? t.issueSummary ?? '';
        const textScore = this.ai.scoreDuplicateSimilarity(text, tText);
        matches.push({
          tempId: t.id,
          ticketId: t.tempTicketId,
          matchScore: Math.min(100, 40 + textScore * 0.5),
          matchReason: 'Same mobile + similar temp grievance',
        });
      }
    }

    if (item.citizenName && item.villageId) {
      const grievances = await this.prisma.grievance.findMany({
        where: {
          villageId: item.villageId,
          reportedByName: { contains: item.citizenName, mode: 'insensitive' },
          status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] },
        },
        take: 3,
      });
      for (const g of grievances) {
        if (matches.some((m) => m.grievanceId === g.id)) continue;
        const textScore = this.ai.scoreDuplicateSimilarity(text, g.description);
        if (textScore >= 20 || item.issueCategory === g.category) {
          matches.push({
            grievanceId: g.id,
            ticketId: g.code,
            matchScore: Math.min(100, 30 + textScore * 0.6),
            matchReason: 'Same citizen location + similar category/text',
          });
        }
      }
    }

    if (item.createdAt && item.source) {
      const windowStart = new Date(item.createdAt.getTime() - 24 * 60 * 60 * 1000);
      const recent = await this.prisma.temporaryGrievance.findMany({
        where: {
          source: item.source as never,
          id: { not: item.id },
          createdAt: { gte: windowStart },
          validationStatus: { notIn: ['Converted', 'Rejected', 'Archived'] },
        },
        take: 3,
      });
      for (const t of recent) {
        if (matches.some((m) => m.tempId === t.id)) continue;
        matches.push({
          tempId: t.id,
          ticketId: t.tempTicketId,
          matchScore: 35,
          matchReason: 'Same source within 24 hours',
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private async transition(
    id: string,
    oldStatus: string,
    newStatus: TempGrievanceStatus,
    action: string,
    remarks: string,
    user: AuthenticatedUser,
    extra?: Prisma.TemporaryGrievanceUpdateInput,
  ) {
    const terminalValidation = ['Validated', 'Converted', 'Duplicate', 'Rejected', 'Archived'];
    if (terminalValidation.includes(newStatus)) {
      await this.sla.resolveValidationViolation(id);
    }

    return this.prisma.temporaryGrievance.update({
      where: { id },
      data: {
        validationStatus: newStatus,
        ...extra,
        validationLogs: {
          create: {
            validationAction: action,
            oldStatus: oldStatus as never,
            newStatus: newStatus as never,
            remarks,
            createdById: user.id,
          },
        },
      },
      include: detailInclude,
    });
  }

  private mapSourceToChannel(source: string): GrievanceChannel {
    const map: Record<string, GrievanceChannel> = {
      WhatsApp: GrievanceChannel.WhatsApp,
      WhatsAppBot: GrievanceChannel.WhatsApp,
      Call: GrievanceChannel.Voice,
      CampaignCall: GrievanceChannel.Voice,
      ConferenceCall: GrievanceChannel.Voice,
      D2DSurvey: GrievanceChannel.Field,
      FieldVisit: GrievanceChannel.Field,
      VolunteerNote: GrievanceChannel.Field,
    };
    return map[source] ?? GrievanceChannel.Web;
  }

  private mapPriority(priority: string): GrievancePriority {
    if (priority === 'Critical' || priority === 'High') return GrievancePriority.High;
    if (priority === 'Low') return GrievancePriority.Low;
    return GrievancePriority.Medium;
  }

  private async nextTicketId() {
    const items = await this.prisma.temporaryGrievance.findMany({ select: { tempTicketId: true } });
    let max = 1000;
    for (const { tempTicketId } of items) {
      const num = parseInt(tempTicketId.replace(/\D/g, ''), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }
    return `TMP-${max + 1}`;
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

  private async ensureExists(id: string) {
    const found = await this.prisma.temporaryGrievance.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Temporary grievance not found');
  }
}
