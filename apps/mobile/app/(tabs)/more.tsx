import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ModuleKey } from '@praja/types';
import { useAuth } from '../../lib/auth';
import { fetchUnreadCount } from '../../lib/crm';
import { Screen, ScreenHeader, Card, Badge, MenuRow } from '../../components/ui';
import { colors } from '../../lib/theme';

// Each entry is gated by the same per-module permission the web admin uses.
// `module: null` means the row is always visible (every signed-in user has it).
type MenuItem = { label: string; description: string; href: Href; module: ModuleKey | null };

export default function More() {
  const { user, logout, hasModule } = useAuth();
  const router = useRouter();
  const { data: unread } = useQuery({ queryKey: ['m-unread'], queryFn: fetchUnreadCount });

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const items: MenuItem[] = [
    { label: 'War Room', description: 'Live campaign command center', href: '/war-room', module: ModuleKey.WarRoom },
    { label: 'Media', description: 'Reputation, attacks & response drafts', href: '/media', module: ModuleKey.Media },
    { label: 'Manifesto', description: 'Election promise progress & field updates', href: '/manifesto', module: ModuleKey.Manifesto },
    { label: 'Crisis', description: 'Emergency issues & acknowledgements', href: '/crisis', module: ModuleKey.Crisis },
    { label: 'Leader Office', description: 'Appointments, calendar & visitor check-in', href: '/leader-office' as Href, module: ModuleKey.LeaderOffice },
    { label: 'Compliance', description: 'Permission status & document upload', href: '/compliance', module: ModuleKey.Compliance },
    { label: 'Security Audit', description: 'Your login history', href: '/security-audit', module: ModuleKey.SecurityAudit },
    { label: 'Fundraising', description: 'Donor search & quick donation capture', href: '/fundraising', module: ModuleKey.Fundraising },
    { label: 'Attendance', description: 'GPS check-in & field attendance', href: '/attendance', module: ModuleKey.Attendance },
    { label: 'Offline Sync', description: 'Pending sync queue status', href: '/offline-sync', module: ModuleKey.OfflineSync },
    { label: 'Voter Intelligence', description: 'Segmentation, tagging & booth strength', href: '/voter-intelligence', module: ModuleKey.VoterIntelligence },
    { label: 'Temp Grievances', description: 'Validate auto-captured complaints before official registration', href: '/temp-grievances', module: ModuleKey.TempGrievances },
    { label: 'Assets', description: 'Roads, hospitals, schools, water supply & more', href: '/assets', module: ModuleKey.Assets },
    { label: 'D2D Survey', description: 'Door-to-door surveys, offline sync & field collection', href: '/d2d', module: ModuleKey.D2D },
    { label: 'Committees & Network', description: 'Committees, observers, leaders, influencers & press', href: '/committees', module: ModuleKey.Committees },
    { label: 'Election Management', description: 'Campaign expenses, works, vehicles & polling day', href: '/election', module: ModuleKey.Election },
    { label: 'Documents', description: 'Browse folders & upload files', href: '/documents', module: ModuleKey.Documents },
    { label: 'Call Center', description: 'Log helpline calls from the field', href: '/call-center/log', module: ModuleKey.CallCenter },
    { label: 'Activities', description: 'Calls, tasks, meetings & field work', href: '/activities', module: ModuleKey.Activities },
    { label: 'My Tasks', description: 'Tasks assigned to you', href: '/activities/tasks', module: ModuleKey.Activities },
    { label: 'Activity Calendar', description: 'Scheduled activities & events', href: '/activities/calendar', module: ModuleKey.Activities },
    { label: 'Events', description: 'Rallies, camps & meetings', href: '/events', module: ModuleKey.Events },
    { label: 'Scheme eligibility', description: 'Check welfare scheme eligibility', href: '/eligibility', module: ModuleKey.Schemes },
    { label: 'Notifications', description: unread?.count ? `${unread.count} unread` : 'All caught up', href: '/notifications', module: null },
    { label: 'Profile', description: 'Your account details', href: '/profile', module: null },
  ];

  const visible = items.filter((i) => i.module === null || hasModule(i.module));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="More" />

        <Card className="mb-4">
          <Text className="text-sm text-gray-500">Signed in as</Text>
          <Text className="mt-1 text-lg font-bold text-navy">{user?.name}</Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
          <View className="mt-2">
            <Badge label={user?.roleLabel ?? ''} color={colors.navy} />
          </View>
        </Card>

        {visible.map((i) => (
          <MenuRow key={i.label} label={i.label} description={i.description} onPress={() => router.push(i.href)} />
        ))}

        <Pressable
          onPress={onLogout}
          className="mt-4 h-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 active:opacity-80"
        >
          <Text className="font-bold text-red-600">Sign out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
