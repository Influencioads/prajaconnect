import * as React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchElectionDashboard } from '../../lib/elections';
import { Screen, ScreenHeader, Card, KpiTile, MenuRow, Loading, SectionTitle } from '../../components/ui';
import { colors } from '../../lib/theme';

function fmtLakhs(n: number) {
  return `₹${(n / 100000).toFixed(1)}L`;
}

function fmtK(n: number) {
  return `₹${(n / 1000).toFixed(0)}K`;
}

export default function ElectionHome() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-election-dashboard'],
    queryFn: () => fetchElectionDashboard(),
  });

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Election Management" subtitle="Campaign command centre" onBack={() => router.back()} />
        <Loading />
      </Screen>
    );
  }

  const { election, kpis } = data!;

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Election Management"
          subtitle={`${election.name} · ${election.status}`}
          onBack={() => router.back()}
        />

        <View className="mb-3 flex-row gap-2">
          <KpiTile label="Total Budget" value={fmtLakhs(kpis.totalBudget)} accent={colors.goldDark} icon="wallet" />
          <KpiTile label="Expenses" value={fmtK(kpis.totalExpenses)} accent={colors.danger} icon="cash" />
        </View>
        <View className="mb-3 flex-row gap-2">
          <KpiTile label="Remaining" value={fmtLakhs(kpis.remainingBudget)} accent={colors.success} icon="trending-up" />
          <KpiTile label="Booths Covered" value={kpis.boothsCovered} accent={colors.info} icon="business" />
        </View>
        <View className="mb-3 flex-row gap-2">
          <KpiTile label="Readiness" value={`${kpis.pollingDayReadinessScore}%`} accent={colors.navy} icon="speedometer" />
          <KpiTile label="Vehicles Active" value={kpis.vehiclesActive} accent={colors.teal} icon="trail-sign" />
        </View>
        <View className="mb-4 flex-row gap-2">
          <KpiTile label="Works Done" value={kpis.worksCompleted} accent={colors.success} icon="checkmark-done" />
          <KpiTile label="Pending Works" value={kpis.pendingWorks} accent={colors.warning} icon="time" />
        </View>

        <Card className="mb-4">
          <Text className="text-xs text-muted">Volunteers · Outreach</Text>
          <Text className="mt-1 text-lg font-bold text-navy">
            {kpis.volunteerStrength} volunteers · {kpis.voterOutreachCount} outreach
          </Text>
        </Card>

        <SectionTitle>Quick Actions</SectionTitle>
        <MenuRow label="My Tasks" description="Campaign works assigned to you" icon="list" onPress={() => router.push('/election/tasks')} />
        <MenuRow label="My Works" description="View and update campaign works" icon="construct" tint={colors.info} onPress={() => router.push('/election/works')} />
        <MenuRow label="Add Expense" description="Log campaign spending" icon="cash" tint={colors.success} onPress={() => router.push('/election/expense-new')} />
        <MenuRow label="Upload Receipt" description="Attach expense receipt photo" icon="cloud-upload" tint={colors.info} onPress={() => router.push('/election/expense-upload')} />
        <MenuRow label="Start Trip" description="Log vehicle trip start" icon="trail-sign" tint={colors.teal} onPress={() => router.push('/election/trip-start')} />
        <MenuRow label="End Trip" description="Log vehicle trip end" icon="flag" tint={colors.teal} onPress={() => router.push('/election/trip-end')} />
        <MenuRow label="Fuel Entry" description="Record fuel purchase" icon="water" tint={colors.warning} onPress={() => router.push('/election/fuel')} />
        <MenuRow label="Booth Status" description="Update booth readiness" icon="business" tint={colors.info} onPress={() => router.push('/election/booth-status')} />
        <MenuRow label="Voter Outreach" description="Log voter contact" icon="megaphone" tint={colors.violet} onPress={() => router.push('/election/outreach-new')} />
        <MenuRow label="Material Received" description="Confirm material distribution" icon="archive" tint={colors.warning} onPress={() => router.push('/election/material-received')} />
        <MenuRow label="Polling Update" description="Polling day booth update" icon="stats-chart" tint={colors.info} onPress={() => router.push('/election/polling-update')} />
        <MenuRow label="Report Issue" description="Emergency polling day issue" icon="warning" tint={colors.danger} onPress={() => router.push('/election/issue-report')} />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
