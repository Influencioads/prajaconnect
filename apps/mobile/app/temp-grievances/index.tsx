import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTempGrievanceAnalytics } from '../../lib/crm';
import { colors } from '../../lib/theme';
import { Screen, ScreenHeader, KpiTile, MenuRow, SectionTitle } from '../../components/ui';

export default function TempGrievancesHome() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-temp-analytics'], queryFn: fetchTempGrievanceAnalytics });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Temp Grievances"
          subtitle="Validation layer before official grievances"
          onBack={() => router.back()}
        />
        <View className="flex-row gap-3">
          <KpiTile label="Total" value={data?.total ?? 0} icon="layers" accent={colors.info} />
          <KpiTile label="Pending" value={data?.pendingValidation ?? 0} icon="time" accent={colors.warning} />
        </View>
        <View className="flex-row gap-3">
          <KpiTile label="Converted" value={data?.converted ?? 0} icon="checkmark-done" accent={colors.success} />
          <KpiTile label="Duplicates" value={data?.duplicateSuspected ?? 0} icon="duplicate" accent={colors.danger} />
        </View>
        <SectionTitle>Actions</SectionTitle>
        <MenuRow
          label="My Validation Queue"
          description="Items assigned or pending validation"
          icon="checkbox"
          tint={colors.warning}
          badge={data?.pendingValidation ? String(data.pendingValidation) : undefined}
          onPress={() => router.push('/temp-grievances/queue')}
        />
        <MenuRow
          label="All Temp Grievances"
          description="Browse and search all records"
          icon="list"
          tint={colors.info}
          onPress={() => router.push('/temp-grievances/queue?all=1')}
        />
        <MenuRow
          label="Create Manually"
          description="Log a temp grievance from the field"
          icon="add-circle"
          tint={colors.success}
          onPress={() => router.push('/temp-grievances/new')}
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
