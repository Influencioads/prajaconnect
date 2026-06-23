import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTempGrievanceAnalytics } from '../../lib/crm';
import { Screen, ScreenHeader, Card, MenuRow } from '../../components/ui';

export default function TempGrievancesHome() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-temp-analytics'], queryFn: fetchTempGrievanceAnalytics });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Temp Grievances" subtitle="Validation layer before official grievances" />
        <View className="mb-4 flex-row flex-wrap gap-2">
          <Card className="min-w-[45%] flex-1"><Text className="text-xs text-gray-500">Total</Text><Text className="text-2xl font-bold text-navy">{data?.total ?? 0}</Text></Card>
          <Card className="min-w-[45%] flex-1"><Text className="text-xs text-gray-500">Pending</Text><Text className="text-2xl font-bold text-amber-600">{data?.pendingValidation ?? 0}</Text></Card>
          <Card className="min-w-[45%] flex-1"><Text className="text-xs text-gray-500">Converted</Text><Text className="text-2xl font-bold text-green-700">{data?.converted ?? 0}</Text></Card>
          <Card className="min-w-[45%] flex-1"><Text className="text-xs text-gray-500">Duplicates</Text><Text className="text-2xl font-bold text-orange-600">{data?.duplicateSuspected ?? 0}</Text></Card>
        </View>
        <MenuRow label="My Validation Queue" description="Items assigned or pending validation" onPress={() => router.push('/temp-grievances/queue')} />
        <MenuRow label="All Temp Grievances" description="Browse and search all records" onPress={() => router.push('/temp-grievances/queue?all=1')} />
        <MenuRow label="Create Manually" description="Log a temp grievance from the field" onPress={() => router.push('/temp-grievances/new')} />
        <Pressable onPress={() => router.back()} className="mt-4 py-3"><Text className="text-center font-semibold text-navy">Back</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}
