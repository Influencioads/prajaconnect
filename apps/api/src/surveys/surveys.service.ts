import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import {
  CreateSurveyDto,
  SubmitResponseDto,
  SurveyQueryDto,
  UpdateSurveyDto,
} from './dto/survey.dto';

export interface Question {
  id: string;
  type: 'single' | 'multi' | 'rating' | 'text';
  text: string;
  options?: string[];
}

@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}

  async list(query: SurveyQueryDto) {
    const { page, limit, search, status } = query;
    const where: Prisma.SurveyWhereInput = {};
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.survey.findMany({
        where,
        include: { _count: { select: { responses: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.survey.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const [total, active, responses] = await Promise.all([
      this.prisma.survey.count(),
      this.prisma.survey.count({ where: { status: 'Active' } }),
      this.prisma.surveyResponse.count(),
    ]);
    return { total, active, responses };
  }

  async get(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        responses: {
          orderBy: { submittedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            respondentName: true,
            answers: true,
            submittedAt: true,
          },
        },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundException('Survey not found');

    const questions = (survey.questions as unknown as Question[]) ?? [];
    const allResponses = await this.prisma.surveyResponse.findMany({
      where: { surveyId: id },
      select: { answers: true },
    });

    const aggregates = questions.map((q) => {
      if (q.type === 'single' || q.type === 'multi') {
        const counts: Record<string, number> = {};
        (q.options ?? []).forEach((o) => (counts[o] = 0));
        for (const r of allResponses) {
          const ans = (r.answers as Record<string, unknown>)[q.id];
          const values = Array.isArray(ans) ? ans : [ans];
          for (const v of values) {
            const key = String(v);
            if (key) counts[key] = (counts[key] ?? 0) + 1;
          }
        }
        return { id: q.id, text: q.text, type: q.type, distribution: counts };
      }
      if (q.type === 'rating') {
        let sum = 0;
        let n = 0;
        const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        for (const r of allResponses) {
          const v = Number((r.answers as Record<string, unknown>)[q.id]);
          if (!Number.isNaN(v) && v > 0) {
            sum += v;
            n++;
            dist[String(v)] = (dist[String(v)] ?? 0) + 1;
          }
        }
        return { id: q.id, text: q.text, type: q.type, average: n ? sum / n : 0, distribution: dist };
      }
      const samples = allResponses
        .map((r) => (r.answers as Record<string, unknown>)[q.id])
        .filter((v) => v && String(v).trim())
        .slice(0, 20)
        .map(String);
      return { id: q.id, text: q.text, type: q.type, samples };
    });

    return { ...survey, questions, aggregates };
  }

  async create(dto: CreateSurveyDto) {
    const { startAt, endAt, questions, ...rest } = dto;
    return this.prisma.survey.create({
      data: {
        ...rest,
        questions: questions as Prisma.InputJsonValue,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
      },
    });
  }

  async update(id: string, dto: UpdateSurveyDto) {
    await this.ensureExists(id);
    const { questions, ...rest } = dto;
    return this.prisma.survey.update({
      where: { id },
      data: {
        ...rest,
        ...(questions !== undefined ? { questions: questions as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async submitResponse(id: string, dto: SubmitResponseDto) {
    await this.ensureExists(id);
    return this.prisma.surveyResponse.create({
      data: {
        surveyId: id,
        answers: dto.answers as Prisma.InputJsonValue,
        respondentName: dto.respondentName,
        respondentMobile: dto.respondentMobile,
        citizenId: dto.citizenId,
      },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.survey.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Survey not found');
  }
}
