import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchPermissionRequest, fetchPermissionRequests } from '../../lib/compliance';
import { Screen, ScreenHeader, Card, Badge, PrimaryButton, Field, SectionTitle, ListRow } from '../../components/ui';
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
          <Field
            label="Lookup by ID"
            value={searchId}
            onChangeText={setSearchId}
            placeholder="Permission request ID"
            icon="search"
            error={error || undefined}
          />
          <PrimaryButton
            label={isFetching ? 'Looking up…' : 'Check Status'}
            onPress={lookup}
            loading={isFetching}
            icon="shield-checkmark"
          />
        </Card>

        {detail && (
          <Card className="mb-4">
            <Text className="text-lg font-bold text-ink">{detail.title}</Text>
            <View className="mt-2 flex-row gap-2">
              <Badge label={detail.type} color={colors.info} />
              <Badge
                label={detail.status}
                color={detail.status === 'Approved' ? colors.success : detail.status === 'Rejected' ? colors.danger : colors.warning}
                dot
              />
            </View>
            <Text className="mt-2 text-xs text-faint">Updated {new Date(detail.updatedAt).toLocaleString()}</Text>
            {detail.documents?.length ? (
              <View className="mt-3">
                <Text className="text-sm font-semibold text-ink">Documents ({detail.documents.length})</Text>
                {detail.documents.map((d) => (
                  <View key={d.id} className="mt-1.5 flex-row items-center">
                    <Ionicons name="document-text-outline" size={14} color={colors.info} />
                    <Text className="ml-1.5 flex-1 text-sm text-muted" numberOfLines={1}>{d.fileName ?? d.fileUrl}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        )}

        <SectionTitle>Recent Requests</SectionTitle>
        {(list?.data ?? []).map((p) => (
          <ListRow
            key={p.id}
            title={p.title}
            subtitle={`${p.type} · ${p.status}`}
            icon="document-text"
            tint={colors.info}
            onPress={() => { setSearchId(p.id); setLookupId(p.id); setError(''); }}
          />
        ))}

        <PrimaryButton
          label="Upload Document"
          variant="gold"
          icon="cloud-upload"
          onPress={() => router.push('/compliance/upload')}
          className="mt-4"
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
