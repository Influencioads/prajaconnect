import * as React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchLetters } from '../../lib/letters';
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
} from '../../components/ui';

type StatusTab = 'All' | 'Draft' | 'Final' | 'Issued';

export default function LettersList() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState<StatusTab>('All');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['m-letters', debounced, status],
    queryFn: () =>
      fetchLetters({
        limit: 50,
        search: debounced || undefined,
        status: status === 'All' ? undefined : status,
      }),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="AI Letters"
          subtitle="Draft & track official letters"
          onBack={() => router.back()}
          right={
            <Pressable
              onPress={() => router.push('/letters/new')}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.navy }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          }
        />
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search ref no, subject…" />
        <SegmentedTabs
          tabs={[
            { key: 'All', label: 'All' },
            { key: 'Draft', label: 'Draft' },
            { key: 'Final', label: 'Final' },
            { key: 'Issued', label: 'Issued' },
          ]}
          value={status}
          onChange={setStatus}
        />
        {isLoading ? (
          <Loading label="Loading letters…" />
        ) : !data?.data.length ? (
          <EmptyState title="No letters" subtitle="Tap + to draft your first letter" icon="mail-outline" />
        ) : (
          data.data.map((l) => (
            <ListRow
              key={l.id}
              title={l.subject}
              subtitle={`${l.refNo} • To ${l.addresseeName}`}
              icon="mail"
              tint={colors.navy}
              right={<StatusPill status={l.status} />}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
