import * as React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchElectionDashboard } from '../../lib/elections';
import { Screen, ScreenHeader, Card, KpiTile, MenuRow, Loading } from '../../components/ui';
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
        <ScreenHeader title="Election Management" onBack={() => router.back()} />
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
          <KpiTile label="Total Budget" value={fmtLakhs(kpis.totalBudget)} accent={colors.goldDark} />
          <KpiTile label="Expenses" value={fmtK(kpis.totalExpenses)} accent={colors.danger} />
        </View>
        <View className="mb-3 flex-row gap-2">
          <KpiTile label="Remaining" value={fmtLakhs(kpis.remainingBudget)} accent={colors.success} />
          <KpiTile label="Booths Covered" value={kpis.boothsCovered} accent="#2563EB" />
        </View>
        <View className="mb-3 flex-row gap-2">
          <KpiTile label="Readiness" value={`${kpis.pollingDayReadinessScore}%`} accent={colors.navy} />
          <KpiTile label="Vehicles Active" value={kpis.vehiclesActive} accent={colors.navy} />
        </View>
        <View className="mb-4 flex-row gap-2">
          <KpiTile label="Works Done" value={kpis.worksCompleted} accent={colors.success} />
          <KpiTile label="Pending Works" value={kpis.pendingWorks} accent={colors.warning} />
        </View>

        <Card className="mb-4">
          <Text className="text-xs text-gray-500">Volunteers · Outreach</Text>
          <Text className="mt-1 text-lg font-bold text-navy">
            {kpis.volunteerStrength} volunteers · {kpis.voterOutreachCount} outreach
          </Text>
        </Card>

        <Text className="mb-2 text-base font-bold text-navy">Quick Actions</Text>
        <MenuRow label="My Tasks" description="Campaign works assigned to you" onPress={() => router.push('/election/tasks')} />
        <MenuRow label="My Works" description="View and update campaign works" onPress={() => router.push('/election/works')} />
        <MenuRow label="Add Expense" description="Log campaign spending" onPress={() => router.push('/election/expense-new')} />
        <MenuRow label="Upload Receipt" description="Attach expense receipt photo" onPress={() => router.push('/election/expense-upload')} />
        <MenuRow label="Start Trip" description="Log vehicle trip start" onPress={() => router.push('/election/trip-start')} />
        <MenuRow label="End Trip" description="Log vehicle trip end" onPress={() => router.push('/election/trip-end')} />
        <MenuRow label="Fuel Entry" description="Record fuel purchase" onPress={() => router.push('/election/fuel')} />
        <MenuRow label="Booth Status" description="Update booth readiness" onPress={() => router.push('/election/booth-status')} />
        <MenuRow label="Voter Outreach" description="Log voter contact" onPress={() => router.push('/election/outreach-new')} />
        <MenuRow label="Material Received" description="Confirm material distribution" onPress={() => router.push('/election/material-received')} />
        <MenuRow label="Polling Update" description="Polling day booth update" onPress={() => router.push('/election/polling-update')} />
        <MenuRow label="Report Issue" description="Emergency polling day issue" onPress={() => router.push('/election/issue-report')} />
      </ScrollView>
    </Screen>
  );
}
