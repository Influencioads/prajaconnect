import { useQuery } from '@tanstack/react-query';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import {
  Screen,
  ScreenHeader,
  Card,
  SectionTitle,
  PrimaryButton,
  Loading,
  EmptyState,
} from '../../components/ui';
import { colors } from '../../lib/theme';
import { bulletinPdfUrl, fetchBulletin, BULLETIN_SECTION_ROUTES, type BulletinSection } from '../../lib/bulletin';

function DeltaText({ delta }: { delta?: number }) {
  if (delta == null || delta === 0) return null;
  const up = delta > 0;
  return (
    <Text className="text-xs font-bold" style={{ color: up ? colors.success : colors.danger }}>
      {up ? ` +${delta}` : ` ${delta}`}
    </Text>
  );
}

function SectionCard({ section, onOpen }: { section: BulletinSection; onOpen?: () => void }) {
  return (
    <Card className="mb-3">
      <View className="flex-row flex-wrap gap-x-4 gap-y-2">
        {section.kpis.map((k) => (
          <View key={k.label} className="min-w-[90px]">
            <Text className="text-lg font-extrabold text-ink">
              {k.value}
              <DeltaText delta={k.delta} />
            </Text>
            <Text className="text-[11px] text-muted">{k.label}</Text>
          </View>
        ))}
      </View>
      {section.rows && section.rows.length > 0 && (
        <View className="mt-3 border-t border-line pt-2">
          {section.rows.slice(0, 5).map((row, i) => (
            <Text key={i} className="py-0.5 text-xs text-muted" numberOfLines={2}>
              • {Object.values(row).filter(Boolean).join(' — ')}
            </Text>
          ))}
        </View>
      )}
      {onOpen ? (
        <Text className="mt-2 text-xs font-bold" style={{ color: colors.navy }} onPress={onOpen}>
          Open module →
        </Text>
      ) : null}
    </Card>
  );
}

export default function BulletinDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['m-bulletin', id],
    queryFn: () => fetchBulletin(id),
    enabled: !!id,
  });

  const pdfUrl = data ? bulletinPdfUrl(data) : null;
  const sections = (data?.sections ?? []) as BulletinSection[];
  const editionLabel = data ? data.edition.charAt(0).toUpperCase() + data.edition.slice(1) : '';

  return (
    <Screen>
      <ScreenHeader
        title={data ? `${editionLabel} Bulletin` : 'Bulletin'}
        subtitle={data ? new Date(data.date).toDateString() : ''}
        onBack={() => router.back()}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <Loading label="Loading bulletin…" />
        ) : !data ? (
          <EmptyState title="Bulletin not found" icon="newspaper-outline" />
        ) : (
          <>
            {data.narrative ? (
              <Card className="mb-3">
                <Text className="text-sm leading-5 text-ink">{data.narrative}</Text>
                {data.narrativeTe ? (
                  <Text className="mt-2 border-t border-line pt-2 text-sm leading-5 text-muted">
                    {data.narrativeTe}
                  </Text>
                ) : null}
              </Card>
            ) : null}

            {pdfUrl ? (
              <PrimaryButton
                variant="gold"
                icon="download"
                label="Download / Share PDF"
                onPress={() => Linking.openURL(pdfUrl)}
                className="mb-2"
              />
            ) : null}

            {sections.map((s) => {
              const route = BULLETIN_SECTION_ROUTES[s.key];
              return (
                <View key={s.key}>
                  <SectionTitle>{s.title}</SectionTitle>
                  <SectionCard
                    section={s}
                    onOpen={route ? () => router.push(route as Href) : undefined}
                  />
                </View>
              );
            })}
            <View className="h-6" />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
