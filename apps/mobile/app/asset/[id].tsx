import * as React from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetCategory, ASSET_CATEGORY_SLUGS } from '@praja/types';
import {
  Screen,
  ScreenHeader,
  Card,
  StatusPill,
  Badge,
  Loading,
} from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { fetchAsset, deleteAsset, configForSlug } from '../../lib/assets';
import { colors } from '../../lib/theme';

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="mb-2 flex-row justify-between">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="ml-3 flex-1 text-right text-sm font-medium text-navy">{value}</Text>
    </View>
  );
}

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const level = user?.permissions?.find((p) => p.module === 'assets')?.accessLevel;
  const canEdit = level === 'edit' || level === 'full';
  const canDelete = level === 'full';

  const { data: asset, isLoading } = useQuery({ queryKey: ['m-asset', id], queryFn: () => fetchAsset(id) });

  if (isLoading || !asset) {
    return (
      <Screen>
        <ScreenHeader title="Asset" onBack={() => router.back()} />
        <Loading />
      </Screen>
    );
  }

  const slug = ASSET_CATEGORY_SLUGS[asset.category as AssetCategory] ?? 'roads';
  const config = configForSlug(slug);
  const detailRecord = (config.fields.find((f) => f.store === 'detail')?.detailKey
    ? (asset as unknown as Record<string, Record<string, unknown> | null>)[config.fields.find((f) => f.store === 'detail')!.detailKey!]
    : null) ?? {};
  const attributes = asset.attributes ?? {};

  const onDelete = () => {
    Alert.alert('Delete asset', `Delete ${asset.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsset(id);
            qc.invalidateQueries({ queryKey: ['m-assets'] });
            qc.invalidateQueries({ queryKey: ['m-asset-stats'] });
            router.back();
          } catch (e) {
            Alert.alert('Failed', apiError(e));
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title={asset.name} subtitle={asset.code} onBack={() => router.back()} />

        <View className="mb-3 flex-row gap-2">
          <StatusPill status={asset.status} />
          {asset.condition ? <Badge label={asset.condition} color={colors.warning} /> : null}
        </View>

        <Card className="mb-3">
          {config.fields.map((f) => {
            const raw = f.store === 'detail' ? detailRecord[f.key] : attributes[f.key];
            let value: string | null = null;
            if (raw != null && raw !== '') value = f.type === 'boolean' ? (raw ? 'Yes' : 'No') : String(raw);
            return <Row key={f.key} label={f.label} value={value} />;
          })}
          <Row label="Mandal" value={asset.mandal?.name} />
          <Row label="Village" value={asset.village?.name} />
          <Row label="Ward" value={asset.wardNumber} />
          <Row label="Contractor" value={asset.contractor} />
          <Row label="Department" value={asset.department?.name} />
          <Row label="Address" value={asset.address} />
          {asset.description ? <Row label="Notes" value={asset.description} /> : null}
        </Card>

        {asset.logs?.length ? (
          <Card className="mb-3">
            <Text className="mb-2 text-sm font-bold text-navy">History</Text>
            {asset.logs.map((l) => (
              <View key={l.id} className="mb-2 border-b border-gray-100 pb-2">
                <Text className="text-sm font-semibold text-navy">{l.type}</Text>
                {l.note ? <Text className="text-xs text-gray-500">{l.note}</Text> : null}
                <Text className="text-[11px] text-gray-400">{new Date(l.performedAt).toLocaleDateString()}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {asset.grievances?.length ? (
          <Card className="mb-3">
            <Text className="mb-2 text-sm font-bold text-navy">Linked grievances</Text>
            {asset.grievances.map((g) => (
              <Pressable key={g.id} onPress={() => router.push(`/grievance/${g.id}`)} className="mb-1.5">
                <Text className="text-sm font-medium text-navy">{g.title}</Text>
                <Text className="text-xs text-gray-500">{g.code} · {g.status}</Text>
              </Pressable>
            ))}
          </Card>
        ) : null}

        <View className="mb-12 mt-1 gap-2">
          {canEdit ? (
            <Pressable
              onPress={() => router.push(`/asset/form?category=${slug}&id=${asset.id}`)}
              className="h-12 items-center justify-center rounded-xl bg-navy active:opacity-90"
            >
              <Text className="font-bold text-white">Edit asset</Text>
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable onPress={onDelete} className="h-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 active:opacity-80">
              <Text className="font-bold text-red-600">Delete asset</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
