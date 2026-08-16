import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { ActivityStatus, ActivityType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ActivitiesService } from '../activities/activities.service';
import {
  AssignVolunteerTaskDto,
  LogVolunteerHoursDto,
  UpdateVolunteerProfileDto,
  VolunteerProfileQueryDto,
} from './dto/service-request.dto';

const POINTS_PER_COMPLETED_ACTIVITY = 10;

const profileInclude = {
  registration: { select: { id: true, name: true, mobile: true, village: true, status: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.VolunteerProfileInclude;

function toSkills(value: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : [];
}

@Injectable()
export class VolunteersService {
  constructor(
    private prisma: PrismaService,
    private activities: ActivitiesService,
  ) {}

  async list(query: VolunteerProfileQueryDto) {
    const { page, limit, search, skills, active } = query;
    const where: Prisma.VolunteerProfileWhereInput = {};
    if (active !== undefined) where.active = active === 'true';
    if (search) {
      const term = { contains: search, mode: 'insensitive' as const };
      where.registration = { OR: [{ name: term }, { mobile: term }, { village: term }] };
    }

    const [rows, total] = await Promise.all([
      this.prisma.volunteerProfile.findMany({
        where,
        include: profileInclude,
        orderBy: [{ points: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.volunteerProfile.count({ where }),
    ]);

    // ponytail: skills live in a Json column, so the filter runs in JS over the page.
    // Move to a relational VolunteerSkill table if this ever needs to page over matches.
    const wanted = (skills ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const data = wanted.length
      ? rows.filter((r) => toSkills(r.skills).some((s) => wanted.includes(s.toLowerCase())))
      : rows;

    return { data, meta: paginate(page, limit, wanted.length ? data.length : total) };
  }

  async get(id: string) {
    const profile = await this.prisma.volunteerProfile.findUnique({ where: { id }, include: profileInclude });
    if (!profile) throw new NotFoundException('Volunteer profile not found');
    return profile;
  }

  async update(id: string, dto: UpdateVolunteerProfileDto) {
    await this.get(id);
    return this.prisma.volunteerProfile.update({
      where: { id },
      data: { skills: dto.skills, active: dto.active, userId: dto.userId },
      include: profileInclude,
    });
  }

  /**
   * Volunteers registered through the public portal have no User account, so the task
   * is still logged as an Activity but tagged with `metadata.volunteerProfileId` — that
   * tag is what the points/leaderboard queries count. When the profile is linked to a
   * User the activity is also assigned to them the usual way.
   */
  async assignTask(id: string, dto: AssignVolunteerTaskDto, user: AuthenticatedUser) {
    const profile = await this.get(id);

    const activity = await this.activities.create(
      {
        type: ActivityType.Task,
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt,
        assignedToUserId: profile.userId ?? undefined,
        contactName: profile.registration.name,
        contactMobile: profile.registration.mobile,
        metadata: { volunteerProfileId: profile.id },
      },
      user,
    );

    return {
      activity,
      assignedToUser: !!profile.userId,
      note: profile.userId
        ? undefined
        : 'Volunteer has no user account — task tagged to the profile instead of a user assignee.',
    };
  }

  async logHours(id: string, dto: LogVolunteerHoursDto, user: AuthenticatedUser) {
    const profile = await this.get(id);
    const totalHours = Number((profile.totalHours + dto.hours).toFixed(2));
    const points = await this.computePoints(profile.id, profile.userId, totalHours);

    if (dto.note) {
      await this.activities.create(
        {
          type: ActivityType.VolunteerActivity,
          title: `${dto.hours}h logged — ${profile.registration.name}`,
          description: dto.note,
          status: ActivityStatus.Completed,
          durationSec: Math.round(dto.hours * 3600),
          assignedToUserId: profile.userId ?? undefined,
          contactName: profile.registration.name,
          contactMobile: profile.registration.mobile,
          metadata: { volunteerProfileId: profile.id },
        },
        user,
      );
    }

    return this.prisma.volunteerProfile.update({
      where: { id },
      data: { totalHours, points },
      include: profileInclude,
    });
  }

  async refreshPoints(id: string) {
    const profile = await this.get(id);
    const points = await this.computePoints(profile.id, profile.userId, profile.totalHours);
    return this.prisma.volunteerProfile.update({ where: { id }, data: { points }, include: profileInclude });
  }

  async leaderboard(limit = 20) {
    const rows = await this.prisma.volunteerProfile.findMany({
      where: { active: true },
      include: profileInclude,
      orderBy: [{ points: 'desc' }, { totalHours: 'desc' }],
      take: Math.min(limit, 100),
    });
    return rows.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      name: r.registration.name,
      village: r.registration.village,
      skills: toSkills(r.skills),
      totalHours: r.totalHours,
      points: r.points,
    }));
  }

  /** Points = completed activities x 10 + whole hours logged. */
  private async computePoints(profileId: string, userId: string | null, totalHours: number) {
    const or: Prisma.ActivityWhereInput[] = [
      { metadata: { path: ['volunteerProfileId'], equals: profileId } },
    ];
    if (userId) or.push({ assignedToUserId: userId });

    const completed = await this.prisma.activity.count({
      where: { status: ActivityStatus.Completed, OR: or },
    });
    return completed * POINTS_PER_COMPLETED_ACTIVITY + Math.floor(totalHours);
  }
}
