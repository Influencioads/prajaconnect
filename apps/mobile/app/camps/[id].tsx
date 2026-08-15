import * as React from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCitizens } from '../../lib/crm';
import { apiError } from '../../lib/api';
import {
  CAMP_OUTCOMES,
  fetchCamp,
  registerWalkIn,
  updateRegistration,
  type CampRegistrationItem,
} from '../../lib/camps';
import {
  Screen,
  ScreenHeader,
  SegmentedTabs,
  SearchBar,
  Field,
  PrimaryButton,
  Chip,
  Card,
  Badge,
  StatusPill,
  Loading,
  EmptyState,
} from '../../components/ui';
import { colors } from '../../lib/theme';

type Tab = 'registrations' | 'walkin';

export default function CampConsole() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<Tab>('registrations');

  const { data: camp, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-camp', id],
    queryFn: () => fetchCamp(id),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['m-camp', id] });

  if (isLoading || !camp) {
    return (
      <Screen>
        <ScreenHeader title="Camp" onBack={() => router.back()} />
        <Loading />
      </Screen>
    );
  }

  const resolved = camp.registrations.filter((r) => r.resolvedOnSpot).length;

  return (
    <Screen>
      <ScreenHeader
        title={camp.name}
        subtitle={`${camp.village?.name ?? camp.mandal?.name ?? '—'} · ${camp.registrations.length} registered · ${resolved} resolved`}
        onBack={() => router.back()}
      />
      <SegmentedTabs<Tab>
        tabs={[
          { key: 'registrations', label: 'Registrations' },
          { key: 'walkin', label: 'Walk-in' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'registrations' ? (
        <RegistrationList
          registrations={camp.registrations}
          onChanged={invalidate}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      ) : (
        <WalkInForm campId={id} onDone={() => { invalidate(); setTab('registrations'); }} />
      )}
    </Screen>
  );
}

function RegistrationList({
  registrations,
  onChanged,
  refreshing,
  onRefresh,
}: {
  registrations: CampRegistrationItem[];
  onChanged: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const mut = useMutation({
    mutationFn: ({ regId, payload }: { regId: string; payload: Record<string, unknown> }) =>
      updateRegistration(regId, payload),
    onSuccess: onChanged,
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  return (
    <FlatList
      data={registrations}
      keyExtractor={(r) => r.id}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<EmptyState title="No registrations yet" subtitle="Pre-register matches on web or add walk-ins." icon="people-outline" />}
      ListFooterComponent={<View className="h-6" />}
      renderItem={({ item }) => (
        <Pressable onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
          <Card className="mb-2.5">
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#E6EBF3]">
                <Text className="text-sm font-extrabold text-ink">#{item.token}</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>{item.citizen.name}</Text>
                <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
                  {item.source}{item.purpose ? ` · ${item.purpose}` : ''}
                </Text>
              </View>
              {item.outcome ? <StatusPill status={item.outcome} /> : <Badge label="Pending" color={colors.muted} />}
            </View>

            {expanded === item.id ? (
              <View className="mt-3 border-t border-line pt-3">
                <Text className="mb-2 text-xs font-semibold text-muted">Outcome</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CAMP_OUTCOMES.map((o) => (
                    <Chip
                      key={o}
                      label={o}
                      active={item.outcome === o}
                      onPress={() => mut.mutate({ regId: item.id, payload: { outcome: o } })}
                    />
                  ))}
                </View>
                <View className="mt-2.5 flex-row">
                  <Chip
                    label={item.resolvedOnSpot ? 'Resolved on spot ✓' : 'Mark resolved on spot'}
                    active={item.resolvedOnSpot}
                    color={colors.success}
                    onPress={() => mut.mutate({ regId: item.id, payload: { resolvedOnSpot: !item.resolvedOnSpot } })}
                  />
                </View>
              </View>
            ) : null}
          </Card>
        </Pressable>
      )}
    />
  );
}

function WalkInForm({ campId, onDone }: { campId: string; onDone: () => void }) {
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [citizenId, setCitizenId] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data } = useQuery({
    queryKey: ['m-walkin-citizens', debounced],
    queryFn: () => fetchCitizens({ search: debounced || undefined }),
  });

  const submit = async () => {
    setSaving(true);
    try {
      const reg = await registerWalkIn(campId, citizenId, purpose || undefined);
      Alert.alert('Registered', `Token number: #${reg.token}`);
      setCitizenId('');
      setSearch('');
      setPurpose('');
      onDone();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FlatList
      data={data?.data ?? []}
      keyExtractor={(c) => c.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search citizen by name / mobile…" />
      }
      ListEmptyComponent={<EmptyState title="No citizens found" subtitle="Search to find the walk-in citizen." icon="person-outline" />}
      ListFooterComponent={
        <View className="pb-8">
          <Field label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Pension application, ration card…" />
          <PrimaryButton
            label={saving ? 'Registering…' : 'Register walk-in'}
            onPress={submit}
            disabled={!citizenId || saving}
          />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => setCitizenId(item.id)}
          className="mb-2 flex-row items-center rounded-2xl border bg-white p-3.5"
          style={{ borderColor: citizenId === item.id ? colors.navy : colors.border }}
        >
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-ink">{item.name}</Text>
            <Text className="mt-0.5 text-xs text-muted">
              {item.mobile ?? '—'}{item.village?.name ? ` · ${item.village.name}` : ''}
            </Text>
          </View>
          {citizenId === item.id ? <Badge label="Selected" color={colors.navy} /> : null}
        </Pressable>
      )}
    />
  );
}
