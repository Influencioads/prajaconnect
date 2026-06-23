import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import type { Request } from 'express';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './upload.config';

export interface MemoryFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadsService {
  save(file: MemoryFile | undefined, req: Request) {
    if (!file) throw new BadRequestException('No file provided (field name must be "file").');

    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

    const ext = extname(file.originalname || '').slice(0, 10);
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    writeFileSync(join(UPLOAD_DIR, filename), file.buffer);

    const origin = `${req.protocol}://${req.get('host')}`;
    return {
      url: `${origin}${UPLOAD_URL_PREFIX}/${filename}`,
      path: `${UPLOAD_URL_PREFIX}/${filename}`,
      filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
