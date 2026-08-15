import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { LettersService } from './letters.service';
import {
  CreateLetterDto,
  DraftLetterDto,
  LetterQueryDto,
  SendLetterDto,
  UpdateLetterDto,
} from './dto/letter.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('letters')
@RequireModule(ModuleKey.Letters, AccessLevel.view)
export class LettersController {
  constructor(private readonly letters: LettersService) {}

  @Get()
  list(@Query() query: LetterQueryDto) {
    return this.letters.list(query);
  }

  @Get('stats')
  stats() {
    return this.letters.stats();
  }

  @Get('options')
  options() {
    return this.letters.options();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.letters.get(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const { stream, refNo } = await this.letters.pdfStream(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${refNo}.pdf"`);
    stream.pipe(res);
  }

  @Post()
  @RequireModule(ModuleKey.Letters, AccessLevel.edit)
  create(@Body() dto: CreateLetterDto, @CurrentUser() user: AuthenticatedUser) {
    return this.letters.create(dto, user);
  }

  @Post('draft')
  @RequireModule(ModuleKey.Letters, AccessLevel.edit)
  draft(@Body() dto: DraftLetterDto) {
    return this.letters.draft(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Letters, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateLetterDto) {
    return this.letters.update(id, dto);
  }

  @Post(':id/finalize')
  @RequireModule(ModuleKey.Letters, AccessLevel.edit)
  finalize(@Param('id') id: string) {
    return this.letters.finalize(id);
  }

  @Post(':id/send')
  @RequireModule(ModuleKey.Letters, AccessLevel.edit)
  send(
    @Param('id') id: string,
    @Body() dto: SendLetterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.letters.send(id, dto, user);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Letters, AccessLevel.edit)
  remove(@Param('id') id: string) {
    return this.letters.remove(id);
  }
}
