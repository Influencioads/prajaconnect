// Catalog of major Indian political parties used to prefill branding (name + colors).
// `colors` are indicative brand colors for theming, not official trademarks.

export type PartyRegion = 'National' | 'AP' | 'TS' | 'KA';

export interface Party {
  code: string;
  name: string;
  fullName: string;
  regions: PartyRegion[];
  symbol: string;
  colors: { primary: string; secondary: string; accent: string };
}

export const PARTIES: Party[] = [
  // ===== National =====
  {
    code: 'BJP',
    name: 'BJP',
    fullName: 'Bharatiya Janata Party',
    regions: ['National', 'AP', 'TS', 'KA'],
    symbol: 'Lotus',
    colors: { primary: '#FF9933', secondary: '#138808', accent: '#046A38' },
  },
  {
    code: 'INC',
    name: 'Congress',
    fullName: 'Indian National Congress',
    regions: ['National', 'AP', 'TS', 'KA'],
    symbol: 'Hand',
    colors: { primary: '#1A73C9', secondary: '#19AAED', accent: '#00BFA5' },
  },
  {
    code: 'AAP',
    name: 'AAP',
    fullName: 'Aam Aadmi Party',
    regions: ['National'],
    symbol: 'Broom',
    colors: { primary: '#0E5BA6', secondary: '#1AA0DD', accent: '#28A745' },
  },
  {
    code: 'BSP',
    name: 'BSP',
    fullName: 'Bahujan Samaj Party',
    regions: ['National'],
    symbol: 'Elephant',
    colors: { primary: '#22409A', secondary: '#2D55C4', accent: '#1B3079' },
  },
  {
    code: 'CPIM',
    name: 'CPI(M)',
    fullName: 'Communist Party of India (Marxist)',
    regions: ['National'],
    symbol: 'Hammer, Sickle & Star',
    colors: { primary: '#D2232A', secondary: '#A4161A', accent: '#FFD500' },
  },
  {
    code: 'NCP',
    name: 'NCP',
    fullName: 'Nationalist Congress Party',
    regions: ['National'],
    symbol: 'Clock',
    colors: { primary: '#00B5EF', secondary: '#0C8FBF', accent: '#E91E63' },
  },

  // ===== Andhra Pradesh =====
  {
    code: 'TDP',
    name: 'TDP',
    fullName: 'Telugu Desam Party',
    regions: ['AP'],
    symbol: 'Bicycle',
    colors: { primary: '#003366', secondary: '#FFD600', accent: '#E11B22' },
  },
  {
    code: 'YSRCP',
    name: 'YSRCP',
    fullName: 'Yuvajana Sramika Rythu Congress Party',
    regions: ['AP'],
    symbol: 'Ceiling Fan',
    colors: { primary: '#1E4FA3', secondary: '#3B6FD4', accent: '#15B04A' },
  },
  {
    code: 'JSP',
    name: 'Jana Sena',
    fullName: 'Jana Sena Party',
    regions: ['AP'],
    symbol: 'Glass Tumbler',
    colors: { primary: '#D2232A', secondary: '#111827', accent: '#FFB300' },
  },

  // ===== Telangana =====
  {
    code: 'BRS',
    name: 'BRS',
    fullName: 'Bharat Rashtra Samithi',
    regions: ['TS'],
    symbol: 'Car',
    colors: { primary: '#E91E63', secondary: '#F06292', accent: '#138808' },
  },
  {
    code: 'AIMIM',
    name: 'AIMIM',
    fullName: 'All India Majlis-e-Ittehadul Muslimeen',
    regions: ['TS'],
    symbol: 'Kite',
    colors: { primary: '#0B6E4F', secondary: '#0F8A63', accent: '#1FB888' },
  },

  // ===== Karnataka =====
  {
    code: 'JDS',
    name: 'JD(S)',
    fullName: 'Janata Dal (Secular)',
    regions: ['KA'],
    symbol: 'Lady Farmer Carrying Paddy',
    colors: { primary: '#138808', secondary: '#0E6B06', accent: '#FFD500' },
  },
];

export const PARTY_REGION_LABELS: Record<PartyRegion, string> = {
  National: 'National',
  AP: 'Andhra Pradesh',
  TS: 'Telangana',
  KA: 'Karnataka',
};

export function partyByCode(code?: string | null): Party | undefined {
  if (!code) return undefined;
  return PARTIES.find((p) => p.code === code);
}
