export const colors = {
  gold: '#FFC800',
  goldDark: '#E6B400',
  goldSoft: '#FFF7DB',
  navy: '#0A2E5C',
  navy700: '#123A6D',
  navy800: '#082444',
  navy900: '#051A33',
  canvas: '#F2F5FA',
  white: '#FFFFFF',
  ink: '#0F1F38',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#E4EAF2',
  surface: '#FFFFFF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  violet: '#7C3AED',
  teal: '#0891B2',
};

export const statusColor: Record<string, string> = {
  Open: colors.danger,
  Assigned: colors.info,
  InProgress: colors.warning,
  Escalated: colors.danger,
  Resolved: colors.success,
  Closed: colors.muted,
  Active: colors.success,
  Inactive: colors.muted,
  Planned: colors.info,
  Scheduled: colors.info,
  Completed: colors.success,
  Cancelled: colors.muted,
  NoResponse: colors.warning,
  FollowUp: colors.warning,
  High: colors.danger,
  Medium: colors.warning,
  Low: colors.muted,
};

// Soft elevation used on cards/buttons — RN needs both iOS shadow* and Android elevation.
export const shadow = {
  card: {
    shadowColor: colors.navy900,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: colors.navy900,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

// Deterministic pastel for initials avatars.
const AVATAR_HUES = ['#2563EB', '#7C3AED', '#0891B2', '#16A34A', '#D97706', '#DB2777', '#DC2626', '#0D9488'];
export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}
