import { ScrollView, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderOfficeDashboard } from '../../lib/leader-office';
import { Screen, ScreenHeader, MenuRow, KpiTile } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function LeaderOfficeHub() {
  const router = useRouter();
  const { data: dash } = useQuery({ queryKey: ['m-leader-dash'], queryFn: fetchLeaderOfficeDashboard });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Leader Office" subtitle="Appointments, calendar & visitors" onBack={() => router.back()} />

        <View className="mb-4 flex-row flex-wrap gap-2">
          <KpiTile label="Pending" value={dash?.pendingAppointments ?? 0} accent={colors.gold} />
          <KpiTile label="Today" value={dash?.todayAppointments ?? 0} accent={colors.navy} />
          <KpiTile label="Visitors" value={dash?.activeVisitors ?? 0} accent={colors.success} />
        </View>

        <MenuRow
          label="Appointments"
          description="View, create & manage visitor appointments"
          onPress={() => router.push('/leader-office/appointments' as Href)}
        />
        <MenuRow
          label="Calendar"
          description="Monthly view of appointments & schedule blocks"
          onPress={() => router.push('/leader-office/calendar' as Href)}
        />
        <MenuRow
          label="Visitor check-in"
          description="Check visitors in and out"
          onPress={() => router.push('/leader-office/visitor-checkin')}
        />
        <MenuRow
          label="Schedule blocks"
          description="Manage office schedule blocks"
          onPress={() => router.push('/leader-office/schedule')}
        />
      </ScrollView>
    </Screen>
  );
}
