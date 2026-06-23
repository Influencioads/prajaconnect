import * as React from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchPermissionRequest, fetchPermissionRequests } from '../../lib/compliance';
import { Screen, ScreenHeader, Card, Badge, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function ComplianceIndex() {
  const router = useRouter();
  const [searchId, setSearchId] = React.useState('');
  const [lookupId, setLookupId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');

  const { data: list } = useQuery({
    queryKey: ['m-compliance-permissions'],
    queryFn: () => fetchPermissionRequests({ page: 1, limit: 10 }),
  });

  const { data: detail, isFetching } = useQuery({
    queryKey: ['m-compliance-permission', lookupId],
    queryFn: () => fetchPermissionRequest(lookupId!),
    enabled: !!lookupId,
    retry: false,
  });

  const lookup = () => {
    setError('');
    if (!searchId.trim()) {
      setError('Enter a permission request ID');
      return;
    }
    setLookupId(searchId.trim());
  };

  React.useEffect(() => {
    if (lookupId && !isFetching && !detail) {
      setError('Permission request not found');
    }
  }, [lookupId, isFetching, detail]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Compliance"
          subtitle="Permission status lookup"
          onBack={() => router.back()}
        />

        <Card className="mb-4">
          <Text className="mb-2 text-sm font-medium text-gray-700">Lookup by ID</Text>
          <TextInput
            value={searchId}
            onChangeText={setSearchId}
            placeholder="Permission request ID"
            className="mb-3 rounded-xl border border-gray-200 px-4 py-3 text-base"
            autoCapitalize="none"
          />
          <PrimaryButton label={isFetching ? 'Looking up…' : 'Check Status'} onPress={lookup} loading={isFetching} />
          {error ? <Text className="mt-2 text-sm text-red-600">{error}</Text> : null}
        </Card>

        {detail && (
          <Card className="mb-4">
            <Text className="text-lg font-bold text-navy">{detail.title}</Text>
            <View className="mt-2 flex-row gap-2">
              <Badge label={detail.type} color={colors.navy} />
              <Badge label={detail.status} color={detail.status === 'Approved' ? '#16a34a' : detail.status === 'Rejected' ? '#dc2626' : colors.gold} />
            </View>
            <Text className="mt-2 text-xs text-gray-500">Updated {new Date(detail.updatedAt).toLocaleString()}</Text>
            {detail.documents?.length ? (
              <View className="mt-3">
                <Text className="text-sm font-medium">Documents ({detail.documents.length})</Text>
                {detail.documents.map((d) => (
                  <Text key={d.id} className="mt-1 text-sm text-gray-600">{d.fileName ?? d.fileUrl}</Text>
                ))}
              </View>
            ) : null}
          </Card>
        )}

        <Text className="mb-2 text-sm font-semibold text-navy">Recent Requests</Text>
        {(list?.data ?? []).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => { setSearchId(p.id); setLookupId(p.id); setError(''); }}
            className="mb-2 rounded-xl border border-gray-200 bg-white px-4 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-navy">{p.title}</Text>
            <Text className="text-xs text-gray-500">{p.type} · {p.status}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => router.push('/compliance/upload')}
          className="mt-4 rounded-xl bg-gold px-4 py-3 active:opacity-80"
        >
          <Text className="text-center font-bold text-navy">Upload Document</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
