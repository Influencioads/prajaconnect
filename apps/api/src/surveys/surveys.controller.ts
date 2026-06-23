import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { SurveysService } from './surveys.service';
import {
  CreateSurveyDto,
  SubmitResponseDto,
  SurveyQueryDto,
  UpdateSurveyDto,
} from './dto/survey.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('surveys')
@RequireModule(ModuleKey.Surveys, AccessLevel.view)
export class SurveysController {
  constructor(private readonly surveys: SurveysService) {}

  @Get()
  list(@Query() query: SurveyQueryDto) {
    return this.surveys.list(query);
  }

  @Get('stats')
  stats() {
    return this.surveys.stats();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.surveys.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Surveys, AccessLevel.edit)
  create(@Body() dto: CreateSurveyDto) {
    return this.surveys.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Surveys, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateSurveyDto) {
    return this.surveys.update(id, dto);
  }

  @Post(':id/responses')
  @RequireModule(ModuleKey.Surveys, AccessLevel.edit)
  submit(@Param('id') id: string, @Body() dto: SubmitResponseDto) {
    return this.surveys.submitResponse(id, dto);
  }
}
