import { readFileSync } from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { BrandingService } from '../branding/branding.service';

export interface PdfSection {
  heading?: string;
  table?: { headers: string[]; rows: (string | number | null | undefined)[][] };
  paragraphs?: string[];
}

export interface BrandedDocInput {
  title: string;
  subtitle?: string;
  pageOrientation?: 'portrait' | 'landscape';
  sections: PdfSection[];
}

// ponytail: Telugu glyphs need a TTF registered via PDF_TELUGU_FONT_PATH env (load into vfs when set); Roboto-only until then.
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private branding: BrandingService,
    private config: ConfigService,
  ) {
    pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any);
    const teluguFontPath = this.config.get<string>('PDF_TELUGU_FONT_PATH', '');
    if (teluguFontPath) {
      try {
        pdfMake.vfs['Telugu.ttf'] = readFileSync(teluguFontPath).toString('base64');
        pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf',
          },
          Telugu: {
            normal: 'Telugu.ttf',
            bold: 'Telugu.ttf',
            italics: 'Telugu.ttf',
            bolditalics: 'Telugu.ttf',
          },
        };
        this.logger.log(`Telugu font registered from ${teluguFontPath}`);
      } catch {
        this.logger.warn(`Failed to load Telugu font from ${teluguFontPath}; rendering PDFs with Roboto only`);
      }
    } else {
      this.logger.log('PDF_TELUGU_FONT_PATH not set; rendering PDFs with Roboto only');
    }
  }

  render(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBuffer((buffer) => resolve(Buffer.from(buffer)));
      } catch (err) {
        reject(err);
      }
    });
  }

  async brandedDoc(input: BrandedDocInput): Promise<TDocumentDefinitions> {
    const branding = await this.branding.getBranding();
    const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const content: Content[] = [
      { text: input.title, fontSize: 16, bold: true, color: branding.primaryColor },
    ];
    if (input.subtitle) {
      content.push({ text: input.subtitle, fontSize: 10, color: '#666666', margin: [0, 2, 0, 0] });
    }
    for (const section of input.sections) {
      if (section.heading) content.push({ text: section.heading, style: 'sectionHeading' });
      for (const paragraph of section.paragraphs ?? []) {
        content.push({ text: paragraph, style: 'paragraph' });
      }
      if (section.table) {
        content.push({
          style: 'table',
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            widths: section.table.headers.map(() => '*' as const),
            body: [
              section.table.headers.map((h) => ({ text: h, style: 'tableHeader' })),
              ...section.table.rows.map((row) =>
                row.map((cell) => (cell === null || cell === undefined ? '' : String(cell))),
              ),
            ],
          },
        });
      }
    }
    return {
      pageSize: 'A4',
      pageOrientation: input.pageOrientation ?? 'portrait',
      pageMargins: [40, 60, 40, 50],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          { text: branding.appName, bold: true, fontSize: 11, color: branding.primaryColor },
          { text: branding.partyFullName || branding.party, alignment: 'right', fontSize: 9, color: '#666666' },
        ],
      },
      footer: (currentPage: number, pageCount: number): Content => ({
        margin: [40, 10, 40, 0],
        columns: [
          { text: `Generated at ${generatedAt}`, fontSize: 8, color: '#666666' },
          { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', fontSize: 8, color: '#666666' },
        ],
      }),
      content,
      styles: {
        sectionHeading: { fontSize: 12, bold: true, margin: [0, 12, 0, 4] },
        paragraph: { fontSize: 10, margin: [0, 0, 0, 6] },
        table: { fontSize: 8, margin: [0, 10, 0, 0] },
        tableHeader: { bold: true, color: '#ffffff', fillColor: branding.primaryColor },
      },
      defaultStyle: { font: 'Roboto' },
    };
  }
}
