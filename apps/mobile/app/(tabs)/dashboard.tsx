import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ModuleKey } from '@praja/types';
import { useAuth } from '../../lib/auth';
import { fetchDashboard, fetchUnreadCount } from '../../lib/crm';
import { KpiTile, Card, StatusPill, Avatar, Skeleton, EmptyState, ErrorState, SectionTitle, IconBubble, type IconName } from '../../components/ui';
import { colors, shadow } from '../../lib/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACTIONS: { label: string; icon: IconName; tint: string; href: string; module: ModuleKey | null }[] = [
  { label: 'New grievance', icon: 'add-circle', tint: colors.danger, href: '/grievance/new', module: null },
  { label: 'Add citizen', icon: 'person-add', tint: colors.info, href: '/citizens/create', module: null },
  { label: 'Attendance', icon: 'finger-print', tint: colors.success, href: '/attendance', module: ModuleKey.Attendance },
  { label: 'D2D survey', icon: 'clipboard', tint: colors.violet, href: '/d2d', module: ModuleKey.D2D },
];

export default function Dashboard() {
  const { user, hasModule } = useAuth();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['m-dashboard'],
    queryFn: fetchDashboard,
  });
  const { data: unread } = useQuery({ queryKey: ['m-unread'], queryFn: fetchUnreadCount });

  const actions = QUICK_ACTIONS.filter((a) => a.module === null || hasModule(a.module));

  return (
    <View className="flex-1" style={{ backgroundColor: colors.navy900 }}>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.canvas }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.white} colors={[colors.navy]} />
          }
        >
          {/* Hero */}
          <LinearGradient
            colors={[colors.navy900, colors.navy, colors.navy700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 52 }}
          >
            <View className="flex-row items-center justify-between px-5 pt-3">
              <Pressable onPress={() => router.push('/profile')} className="flex-row items-center">
                <Avatar name={user?.name ?? '?'} size={44} />
                <View className="ml-3">
                  <Text className="text-[13px] text-white/60">{greeting()},</Text>
                  <Text className="text-lg font-extrabold text-white">{user?.name?.split(' ')[0] ?? ''}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => router.push('/notifications')}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
                hitSlop={6}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.white} />
                {unread?.count ? (
                  <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-navy bg-gold" />
                ) : null}
              </Pressable>
            </View>
            <View className="mt-3 flex-row items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1" style={{ marginLeft: 20 }}>
              <Ionicons name="ribbon-outline" size={12} color={colors.gold} />
              <Text className="text-[11px] font-bold text-gold">{user?.roleLabel}</Text>
            </View>
          </LinearGradient>

          {/* Content overlapping hero */}
          <View className="px-4 pb-10" style={{ marginTop: -40 }}>
            {isError ? (
              <Card>
                <ErrorState title="Couldn’t load dashboard" onRetry={refetch} />
              </Card>
            ) : isLoading || !data ? (
              <>
                <View className="flex-row gap-3">
                  <Card className="flex-1"><Skeleton height={64} /></Card>
                  <Card className="flex-1"><Skeleton height={64} /></Card>
                </View>
                <View className="mt-3 flex-row gap-3">
                  <Card className="flex-1"><Skeleton height={64} /></Card>
                  <Card className="flex-1"><Skeleton height={64} /></Card>
                </View>
                <Card className="mt-3"><Skeleton height={120} /></Card>
              </>
            ) : (
              <>
                <View className="flex-row gap-3">
                  <KpiTile label="Citizens" value={data.kpis.citizens} accent={colors.info} icon="people" />
                  <KpiTile label="Cadre" value={data.kpis.cadre} hint={`${data.kpis.activeCadre} active`} accent={colors.goldDark} icon="id-card" />
                </View>
                <View className="flex-row gap-3">
                  <KpiTile label="Open grievances" value={data.kpis.grievancesOpen} hint={`${data.kpis.grievancesTotal} total`} accent={colors.danger} icon="megaphone" />
                  <KpiTile label="Resolved" value={`${data.kpis.resolutionRate}%`} hint={`${data.kpis.grievancesResolved} closed`} accent={colors.success} icon="checkmark-circle" />
                </View>
                <View className="flex-row gap-3">
                  <KpiTile label="Beneficiaries" value={data.kpis.beneficiaries} accent={colors.violet} icon="gift" />
                  <KpiTile label="Events" value={data.kpis.events} accent={colors.teal} icon="calendar" />
                </View>

                <SectionTitle>Quick actions</SectionTitle>
                <View className="flex-row gap-3">
                  {actions.map((a) => (
                    <Pressable
                      key={a.label}
                      onPress={() => router.push(a.href as never)}
                      className="flex-1 items-center rounded-[20px] border border-line bg-white px-1 py-3.5 active:opacity-80"
                      style={shadow.card}
                    >
                      <IconBubble icon={a.icon} tint={a.tint} size={38} />
                      <Text className="mt-2 text-center text-[11px] font-bold text-ink" numberOfLines={2}>
                        {a.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <SectionTitle>Recent grievances</SectionTitle>
                {data.recentGrievances.length === 0 ? (
                  <Card>
                    <EmptyState title="No grievances yet" icon="megaphone-outline" />
                  </Card>
                ) : (
                  data.recentGrievances.slice(0, 6).map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => router.push(`/grievance/${g.id}`)}
                      className="active:opacity-80"
                    >
                      <Card className="mb-2.5">
                        <View className="flex-row items-center justify-between">
                          <Text className="flex-1 pr-2 text-[15px] font-bold text-ink" numberOfLines={1}>
                            {g.title}
                          </Text>
                          <StatusPill status={g.status} />
                        </View>
                        <View className="mt-1.5 flex-row items-center">
                          <Ionicons name="pricetag-outline" size={11} color={colors.faint} />
                          <Text className="ml-1 text-xs text-muted" numberOfLines={1}>
                            {g.code}
                            {g.mandal ? ` · ${g.mandal}` : ''}
                            {g.citizen ? ` · ${g.citizen}` : ''}
                          </Text>
                        </View>
                      </Card>
                    </Pressable>
                  ))
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
