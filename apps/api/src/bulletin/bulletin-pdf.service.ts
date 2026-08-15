import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { PdfService, PdfSection } from '../pdf/pdf.service';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '../uploads/upload.config';
import type { BulletinSection } from './bulletin-aggregation.service';

@Injectable()
export class BulletinPdfService {
  private readonly logger = new Logger(BulletinPdfService.name);

  constructor(private pdf: PdfService) {}

  filePathFor(pdfUrl: string): string {
    return join(UPLOAD_DIR, pdfUrl.slice(UPLOAD_URL_PREFIX.length + 1));
  }

  async renderAndStore(input: {
    date: Date;
    edition: string;
    narrative?: string | null;
    sections: BulletinSection[];
  }): Promise<{ pdfUrl: string; filePath: string }> {
    const fmtDelta = (d?: number) => (d == null ? '' : d > 0 ? ` (+${d})` : d < 0 ? ` (${d})` : ' (=)');

    const pdfSections: PdfSection[] = [];
    if (input.narrative) {
      pdfSections.push({ heading: 'Executive Summary', paragraphs: input.narrative.split('\n').filter(Boolean) });
    }

    // KPI strip: one row per KPI across all sections.
    pdfSections.push({
      heading: 'Key Indicators',
      table: {
        headers: ['Section', 'Metric', 'Value'],
        rows: input.sections.flatMap((s) =>
          s.kpis.map((k) => [s.title, k.label, `${k.value}${fmtDelta(k.delta)}`]),
        ),
      },
    });

    // One detail table per section that has rows.
    for (const s of input.sections) {
      if (!s.rows?.length) continue;
      const headers = Object.keys(s.rows[0]);
      pdfSections.push({
        heading: s.title,
        table: {
          headers,
          rows: s.rows.map((r) => headers.map((h) => (r[h] == null ? '' : String(r[h])))),
        },
      });
    }

    const editionLabel = input.edition.charAt(0).toUpperCase() + input.edition.slice(1);
    const dateStr = input.date.toISOString().slice(0, 10);
    const doc = await this.pdf.brandedDoc({
      title: `${editionLabel} Constituency Bulletin`,
      subtitle: input.date.toDateString(),
      sections: pdfSections,
    });
    const buffer = await this.pdf.render(doc);

    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
    const filename = `bulletin-${dateStr}-${input.edition}.pdf`;
    const filePath = join(UPLOAD_DIR, filename);
    writeFileSync(filePath, buffer);
    this.logger.log(`Bulletin PDF stored at ${filePath}`);

    return { pdfUrl: `${UPLOAD_URL_PREFIX}/${filename}`, filePath };
  }
}
