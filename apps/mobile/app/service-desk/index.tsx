import * as React from 'react';
import { View, ScrollView, Pressable, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  SERVICE_REQUEST_STATUSES,
  changeServiceRequestStatus,
  fetchServiceRequests,
  type ServiceRequest,
} from '../../lib/service-desk';
import { colors } from '../../lib/theme';
import {
  Screen,
  ScreenHeader,
  SearchBar,
  SegmentedTabs,
  ListRow,
  StatusPill,
  EmptyState,
  Loading,
  Chip,
  SectionTitle,
  PrimaryButton,
} from '../../components/ui';

type StatusTab = 'All' | 'Received' | 'Forwarded' | 'InProcess' | 'Completed';

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Received', label: 'New' },
  { key: 'Forwarded', label: 'Fwd' },
  { key: 'InProcess', label: 'Doing' },
  { key: 'Completed', label: 'Done' },
];

export default function ServiceDeskQueue() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState<StatusTab>('All');
  const [selected, setSelected] = React.useState<ServiceRequest | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['m-service-requests', debounced, status],
    queryFn: () =>
      fetchServiceRequests({
        limit: 50,
        search: debounced || undefined,
        status: status === 'All' ? undefined : status,
      }),
  });

  const update = useMutation({
    mutationFn: (next: string) => changeServiceRequestStatus(selected!.id, { status: next }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['m-service-requests'] });
      setSelected(null);
      Alert.alert('Updated', `${r.refNo} is now ${r.status}.`);
    },
    onError: () => Alert.alert('Error', 'Could not update the request'),
  });

  const rows = data?.data ?? [];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Service Desk"
          subtitle="Citizen certificate & pension requests"
          onBack={() => router.back()}
          right={
            <Pressable
              onPress={() => router.push('/service-desk/new')}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.navy }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          }
        />
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search ref no, name, mobile…" />
        <SegmentedTabs tabs={TABS} value={status} onChange={setStatus} />

        {isLoading ? <Loading label="Loading queue…" /> : null}

        {rows.map((r) => (
          <ListRow
            key={r.id}
            title={`${r.refNo} · ${r.applicantName}`}
            subtitle={[r.type, r.village?.name, r.department?.name].filter(Boolean).join(' · ')}
            icon="document-text"
            tint={r.slaStatus === 'Breached' ? colors.danger : colors.info}
            right={<StatusPill status={r.status} />}
            onPress={() => setSelected(r)}
          />
        ))}

        {!isLoading && rows.length === 0 ? (
          <EmptyState title="Nothing in this queue" subtitle="New requests appear here as citizens apply." icon="document-text-outline" />
        ) : null}

        {selected ? (
          <View className="mb-6 mt-2 rounded-[20px] border border-line bg-white p-4">
            <SectionTitle>{selected.refNo}</SectionTitle>
            <Text className="mb-3 text-sm text-ink">{selected.details}</Text>
            <Text className="mb-2 text-xs text-muted">Move to:</Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {SERVICE_REQUEST_STATUSES.filter((s) => s !== selected.status).map((s) => (
                <Chip key={s} label={s} active={false} onPress={() => update.mutate(s)} color={colors.navy} />
              ))}
            </View>
            <PrimaryButton label="Close" icon="close" onPress={() => setSelected(null)} />
          </View>
        ) : null}

        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
