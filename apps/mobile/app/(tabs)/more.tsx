import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ModuleKey } from '@praja/types';
import { useAuth } from '../../lib/auth';
import { fetchUnreadCount } from '../../lib/crm';
import { Screen, ScreenHeader, Card, Badge, MenuRow, Avatar, SectionTitle, type IconName } from '../../components/ui';
import { colors } from '../../lib/theme';

// Each entry is gated by the same per-module permission the web admin uses.
// `module: null` means the row is always visible (every signed-in user has it).
type MenuItem = {
  label: string;
  description: string;
  href: Href;
  module: ModuleKey | null;
  icon: IconName;
  tint: string;
  badge?: string;
};
type Section = { title: string; items: MenuItem[] };

export default function More() {
  const { user, logout, hasModule } = useAuth();
  const router = useRouter();
  const { data: unread } = useQuery({ queryKey: ['m-unread'], queryFn: fetchUnreadCount });

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const sections: Section[] = [
    {
      title: 'Command center',
      items: [
        { label: 'War Room', description: 'Live campaign command center', href: '/war-room', module: ModuleKey.WarRoom, icon: 'radio', tint: colors.danger },
        { label: 'Media', description: 'Reputation, attacks & response drafts', href: '/media', module: ModuleKey.Media, icon: 'newspaper', tint: colors.info },
        { label: 'Crisis', description: 'Emergency issues & acknowledgements', href: '/crisis', module: ModuleKey.Crisis, icon: 'warning', tint: colors.warning },
        { label: 'Manifesto', description: 'Election promise progress & field updates', href: '/manifesto', module: ModuleKey.Manifesto, icon: 'flag', tint: colors.violet },
        { label: 'Social Media', description: 'Post approvals & rival mentions', href: '/social' as Href, module: ModuleKey.Social, icon: 'share-social', tint: colors.teal },
      ],
    },
    {
      title: 'Field operations',
      items: [
        { label: 'Attendance', description: 'GPS check-in & field attendance', href: '/attendance', module: ModuleKey.Attendance, icon: 'finger-print', tint: colors.success },
        { label: 'D2D Survey', description: 'Door-to-door surveys, offline sync & field collection', href: '/d2d', module: ModuleKey.D2D, icon: 'clipboard', tint: colors.violet },
        { label: 'Activities', description: 'Calls, tasks, meetings & field work', href: '/activities', module: ModuleKey.Activities, icon: 'walk', tint: colors.teal },
        { label: 'My Tasks', description: 'Tasks assigned to you', href: '/activities/tasks', module: ModuleKey.Activities, icon: 'checkbox', tint: colors.info },
        { label: 'Activity Calendar', description: 'Scheduled activities & events', href: '/activities/calendar', module: ModuleKey.Activities, icon: 'calendar', tint: colors.navy },
        { label: 'Events', description: 'Rallies, camps & meetings', href: '/events', module: ModuleKey.Events, icon: 'megaphone', tint: colors.goldDark },
        { label: 'Call Center', description: 'Log helpline calls from the field', href: '/call-center/log', module: ModuleKey.CallCenter, icon: 'call', tint: colors.success },
        { label: 'Temp Grievances', description: 'Validate auto-captured complaints before registration', href: '/temp-grievances', module: ModuleKey.TempGrievances, icon: 'alert-circle', tint: colors.warning },
      ],
    },
    {
      title: 'Organization',
      items: [
        { label: 'Leader Office', description: 'Appointments, calendar & visitor check-in', href: '/leader-office' as Href, module: ModuleKey.LeaderOffice, icon: 'business', tint: colors.navy },
        { label: 'Committees & Network', description: 'Committees, observers, leaders, influencers & press', href: '/committees', module: ModuleKey.Committees, icon: 'git-network', tint: colors.teal },
        { label: 'Election Management', description: 'Campaign expenses, works, vehicles & polling day', href: '/election', module: ModuleKey.Election, icon: 'podium', tint: colors.violet },
        { label: 'Fundraising', description: 'Donor search & quick donation capture', href: '/fundraising', module: ModuleKey.Fundraising, icon: 'cash', tint: colors.success },
        { label: 'Voter Intelligence', description: 'Segmentation, tagging & booth strength', href: '/voter-intelligence', module: ModuleKey.VoterIntelligence, icon: 'analytics', tint: colors.info },
        { label: 'Assets', description: 'Roads, hospitals, schools, water supply & more', href: '/assets', module: ModuleKey.Assets, icon: 'construct', tint: colors.goldDark },
      ],
    },
    {
      title: 'Data & tools',
      items: [
        { label: 'Documents', description: 'Browse folders & upload files', href: '/documents', module: ModuleKey.Documents, icon: 'folder', tint: colors.info },
        { label: 'Compliance', description: 'Permission status & document upload', href: '/compliance', module: ModuleKey.Compliance, icon: 'shield-checkmark', tint: colors.success },
        { label: 'Offline Sync', description: 'Pending sync queue status', href: '/offline-sync', module: ModuleKey.OfflineSync, icon: 'cloud-offline', tint: colors.muted },
        { label: 'Scheme eligibility', description: 'Check welfare scheme eligibility', href: '/eligibility', module: ModuleKey.Schemes, icon: 'ribbon', tint: colors.violet },
        { label: 'Security Audit', description: 'Your login history', href: '/security-audit', module: ModuleKey.SecurityAudit, icon: 'lock-closed', tint: colors.danger },
        { label: 'AI Letters', description: 'Draft official letters with AI', href: '/letters' as Href, module: ModuleKey.Letters, icon: 'mail', tint: colors.navy },
        { label: 'Govt Jobs', description: 'Job notifications & youth dispatch', href: '/jobs', module: ModuleKey.Jobs, icon: 'briefcase', tint: colors.info },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Notifications',
          description: unread?.count ? `${unread.count} unread` : 'All caught up',
          href: '/notifications',
          module: null,
          icon: 'notifications',
          tint: colors.warning,
          badge: unread?.count ? String(unread.count) : undefined,
        },
        { label: 'Profile', description: 'Your account details', href: '/profile', module: null, icon: 'person', tint: colors.navy },
      ],
    },
    {
      title: 'Briefings',
      items: [
        { label: 'Daily Bulletin', description: 'Your 5 AM constituency briefing & archive', href: '/bulletin', module: ModuleKey.Bulletin, icon: 'newspaper', tint: colors.navy },
      title: 'Life events',
      items: [
        { label: 'Life Events', description: "Today's birthdays, anniversaries & wishes", href: '/life-events' as Href, module: ModuleKey.LifeEvents, icon: 'gift', tint: colors.violet },
      ],
    },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="More" subtitle="All modules & settings" />

        <Pressable onPress={() => router.push('/profile')}>
          <Card className="mb-1 flex-row items-center">
            <Avatar name={user?.name ?? '?'} size={52} />
            <View className="ml-3.5 flex-1">
              <Text className="text-base font-extrabold text-ink">{user?.name}</Text>
              <Text className="mt-0.5 text-xs text-muted">{user?.email}</Text>
              <View className="mt-1.5">
                <Badge label={user?.roleLabel ?? ''} color={colors.navy} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Card>
        </Pressable>

        {sections.map((s) => {
          const visible = s.items.filter((i) => i.module === null || hasModule(i.module));
          if (visible.length === 0) return null;
          return (
            <View key={s.title}>
              <SectionTitle>{s.title}</SectionTitle>
              {visible.map((i) => (
                <MenuRow
                  key={i.label}
                  label={i.label}
                  description={i.description}
                  icon={i.icon}
                  tint={i.tint}
                  badge={i.badge}
                  onPress={() => router.push(i.href)}
                />
              ))}
            </View>
          );
        })}

        <Pressable
          onPress={onLogout}
          className="mb-8 mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 active:opacity-80"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text className="font-bold text-red-600">Sign out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
