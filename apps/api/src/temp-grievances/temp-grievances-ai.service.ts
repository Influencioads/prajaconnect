import { Injectable } from '@nestjs/common';

const COMPLAINT_KEYWORDS = [
  'complaint', 'grievance', 'problem', 'issue', 'not working', 'broken', 'shortage',
  'leak', 'pothole', 'garbage', 'water', 'electricity', 'power', 'road', 'hospital',
  'సమస్య', 'ఫిర్యాదు', 'నీరు', 'కరెంటు', 'రోడ్డు',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Water: ['water', 'drinking', 'tanker', 'నీరు', 'నీటి'],
  Roads: ['road', 'pothole', 'street', 'రోడ్డు'],
  Electricity: ['power', 'electricity', 'current', 'voltage', 'కరెంటు'],
  Sanitation: ['garbage', 'waste', 'drain', 'చెత్త'],
  Health: ['hospital', 'medicine', 'phc', 'doctor', 'ఆరోగ్య'],
  Education: ['school', 'teacher', 'education', 'పాఠశాల'],
  Revenue: ['ration', 'card', 'pension', 'రేషన్'],
};

@Injectable()
export class TempGrievancesAiService {
  detectComplaintIntent(text: string): { isComplaint: boolean; confidence: number } {
    const lower = text.toLowerCase();
    const matches = COMPLAINT_KEYWORDS.filter((k) => lower.includes(k.toLowerCase()));
    const confidence = Math.min(0.95, 0.3 + matches.length * 0.15);
    return { isComplaint: matches.length > 0, confidence };
  }

  extractIssueCategory(text: string): { category: string; confidence: number } {
    const lower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
        return { category, confidence: 0.75 };
      }
    }
    return { category: 'Other', confidence: 0.4 };
  }

  predictPriority(text: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const lower = text.toLowerCase();
    if (/urgent|emergency|critical|danger|accident|death|అత్యవసర/.test(lower)) return 'Critical';
    if (/not working|shortage|no water|no power|hospital/.test(lower)) return 'High';
    if (/request|need|please|apply/.test(lower)) return 'Medium';
    return 'Low';
  }

  scoreDuplicateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    if (!wordsA.size || !wordsB.size) return 0;
    let overlap = 0;
    for (const w of wordsA) if (wordsB.has(w)) overlap++;
    return Math.round((overlap / Math.max(wordsA.size, wordsB.size)) * 100);
  }

  translateTeluguToEnglish(text: string): { translated: string; detectedLanguage: 'te' | 'en' | 'mixed' } {
    const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    const detectedLanguage = hasTelugu && hasEnglish ? 'mixed' : hasTelugu ? 'te' : 'en';
    return {
      translated: detectedLanguage === 'te' ? `[AI-translate placeholder] ${text}` : text,
      detectedLanguage,
    };
  }

  generateSummary(text: string): string {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
  }

  recommendDepartment(category: string): { departmentName: string; confidence: number } {
    const map: Record<string, string> = {
      Water: 'Water & Sewerage',
      Roads: 'Roads & Buildings',
      Electricity: 'Electricity (APEPDCL)',
      Sanitation: 'Municipal / Panchayat Raj',
      Health: 'Health & Medical',
      Education: 'Education',
      Revenue: 'Revenue',
    };
    return { departmentName: map[category] ?? 'Municipal / Panchayat Raj', confidence: 0.7 };
  }

  recommendSla(priority: string): number {
    const hours: Record<string, number> = { Critical: 24, High: 48, Medium: 72, Low: 120 };
    return hours[priority] ?? 72;
  }
}
