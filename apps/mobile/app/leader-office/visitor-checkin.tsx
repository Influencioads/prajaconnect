import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchLeaderOfficeDashboard,
  fetchLeaderVisitors,
  checkInVisitor,
  checkOutVisitor,
} from '../../lib/leader-office';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, Field, PrimaryButton, Badge } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function VisitorCheckin() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [purpose, setPurpose] = React.useState('');

  const { data: dash } = useQuery({ queryKey: ['m-leader-dash'], queryFn: fetchLeaderOfficeDashboard });
  const { data: visitors } = useQuery({
    queryKey: ['m-leader-visitors'],
    queryFn: () => fetchLeaderVisitors({ page: 1, limit: 15 }),
  });

  const checkIn = useMutation({
    mutationFn: () => checkInVisitor({ name, mobile: mobile || undefined, purpose: purpose || undefined }),
    onSuccess: () => {
      Alert.alert('Checked in', 'Visitor registered.');
      setName('');
      setMobile('');
      setPurpose('');
      qc.invalidateQueries({ queryKey: ['m-leader-visitors'] });
      qc.invalidateQueries({ queryKey: ['m-leader-dash'] });
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const checkOut = useMutation({
    mutationFn: checkOutVisitor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-leader-visitors'] });
      qc.invalidateQueries({ queryKey: ['m-leader-dash'] });
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Visitor Check-in" subtitle="Register office visitors" onBack={() => router.back()} />

        <View className="mb-4 flex-row flex-wrap gap-2">
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Today</Text>
            <Text className="text-xl font-bold" style={{ color: colors.navy }}>{dash?.visitorsToday ?? 0}</Text>
          </Card>
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Active</Text>
            <Text className="text-xl font-bold" style={{ color: colors.navy }}>{dash?.activeVisitors ?? 0}</Text>
          </Card>
        </View>

        <Card className="mb-4">
          <Field label="Name *" value={name} onChangeText={setName} />
          <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
          <Field label="Purpose" value={purpose} onChangeText={setPurpose} />
          <PrimaryButton
            label={checkIn.isPending ? 'Checking in…' : 'Check in visitor'}
            onPress={name ? () => checkIn.mutate() : undefined}
            loading={checkIn.isPending}
          />
        </Card>

        <Pressable onPress={() => router.push('/leader-office/schedule')} className="mb-4 rounded-xl border px-4 py-3">
          <Text className="text-center font-medium" style={{ color: colors.navy }}>View Schedule</Text>
        </Pressable>

        <Text className="mb-2 text-sm font-semibold text-navy">Recent Visitors</Text>
        {(visitors?.data ?? []).map((v) => (
          <Card key={v.id} className="mb-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-navy">{v.name}</Text>
              {v.checkOutAt ? (
                <Badge label="Out" color={colors.muted} />
              ) : (
                <Pressable onPress={() => checkOut.mutate(v.id)} className="rounded bg-gold px-2 py-1">
                  <Text className="text-xs font-semibold" style={{ color: colors.navy }}>Check out</Text>
                </Pressable>
              )}
            </View>
            <Text className="mt-1 text-xs text-slate-500">
              {v.purpose ?? 'Visit'} · {new Date(v.checkInAt).toLocaleTimeString()}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
