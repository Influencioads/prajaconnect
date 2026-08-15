import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchLeaderOfficeDashboard,
  fetchLeaderVisitors,
  checkInVisitor,
  checkOutVisitor,
} from '../../lib/leader-office';
import { apiError } from '../../lib/api';
import {
  Screen,
  ScreenHeader,
  Card,
  Field,
  PrimaryButton,
  Badge,
  KpiTile,
  SectionTitle,
  ListRow,
  EmptyState,
} from '../../components/ui';
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

        <View className="mb-1 flex-row gap-2">
          <KpiTile label="Today" value={dash?.visitorsToday ?? 0} accent={colors.info} icon="walk" />
          <KpiTile label="Active" value={dash?.activeVisitors ?? 0} accent={colors.success} icon="people" />
        </View>

        <Card className="mb-4">
          <Field label="Name *" value={name} onChangeText={setName} icon="person" />
          <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" icon="call" />
          <Field label="Purpose" value={purpose} onChangeText={setPurpose} icon="clipboard" />
          <PrimaryButton
            label={checkIn.isPending ? 'Checking in…' : 'Check in visitor'}
            icon="person-add"
            onPress={name ? () => checkIn.mutate() : undefined}
            loading={checkIn.isPending}
          />
        </Card>

        <PrimaryButton
          label="View Schedule"
          variant="outline"
          icon="calendar"
          onPress={() => router.push('/leader-office/schedule')}
          className="mb-4"
        />

        <SectionTitle>Recent Visitors</SectionTitle>
        {(visitors?.data ?? []).map((v) => (
          <ListRow
            key={v.id}
            title={v.name}
            avatar
            subtitle={`${v.purpose ?? 'Visit'} · ${new Date(v.checkInAt).toLocaleTimeString()}`}
            right={
              v.checkOutAt ? (
                <Badge label="Out" color={colors.muted} />
              ) : (
                <PrimaryButton small variant="gold" label="Check out" onPress={() => checkOut.mutate(v.id)} />
              )
            }
          />
        ))}
        {!visitors?.data?.length ? (
          <EmptyState title="No visitors yet" subtitle="Checked-in visitors show up here." icon="walk" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
