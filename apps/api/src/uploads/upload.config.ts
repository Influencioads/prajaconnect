import { join } from 'path';

/** Absolute directory where uploaded files are written. Configurable via UPLOAD_DIR. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? process.env.UPLOAD_DIR
  : join(process.cwd(), 'uploads');

/** Public URL prefix under which uploaded files are served (outside the /api prefix). */
export const UPLOAD_URL_PREFIX = '/uploads';
