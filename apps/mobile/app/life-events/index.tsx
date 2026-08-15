import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchLifeEventsToday, sendGreeting, skipGreeting } from '../../lib/life-events';
import {
  Screen,
  ScreenHeader,
  KpiTile,
  SectionTitle,
  Card,
  Badge,
  StatusPill,
  PrimaryButton,
  EmptyState,
  Loading,
} from '../../components/ui';
import { colors } from '../../lib/theme';

const OCCASION_TINT: Record<string, string> = {
  birthday: colors.violet,
  anniversary: colors.gold,
  condolence: colors.muted,
  festival: colors.success,
  deadline: colors.warning,
};

export default function LifeEventsIndex() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['m-life-events-today'], queryFn: fetchLifeEventsToday });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['m-life-events-today'] });
  const send = useMutation({ mutationFn: sendGreeting, onSuccess: invalidate });
  const skip = useMutation({ mutationFn: skipGreeting, onSuccess: invalidate });

  const items = data?.items ?? [];
  const wishes = items.filter((i) => i.occasion === 'birthday' || i.occasion === 'anniversary');
  const others = items.filter((i) => i.occasion !== 'birthday' && i.occasion !== 'anniversary');

  return (
    <Screen>
      <ScreenHeader title="Life Events" subtitle="Today's birthdays & anniversaries" onBack={() => router.back()} />
      {isLoading ? (
        <Loading label="Loading today's events…" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-3">
            <KpiTile label="Pending" value={data?.counts.pending ?? 0} accent={colors.warning} icon="time" />
            <KpiTile label="Sent" value={data?.counts.sent ?? 0} accent={colors.success} icon="paper-plane" />
          </View>

          <SectionTitle>Wishes</SectionTitle>
          {wishes.length === 0 ? (
            <EmptyState title="No birthdays or anniversaries today" subtitle="Check back tomorrow." icon="gift-outline" />
          ) : (
            wishes.map((item) => (
              <Card key={item.id} className="mb-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 pr-2 text-[15px] font-bold text-ink" numberOfLines={1}>
                    {item.targetName}
                  </Text>
                  <StatusPill status={item.status} />
                </View>
                <View className="mt-1.5 flex-row items-center gap-2">
                  <Badge label={item.occasion} color={OCCASION_TINT[item.occasion] ?? colors.navy} />
                  <Text className="text-xs text-muted">{item.targetType}</Text>
                </View>
                <Text className="mt-2 text-xs text-muted" numberOfLines={2}>
                  {item.message}
                </Text>
                {(item.status === 'Pending' || item.status === 'Approved') && (
                  <View className="mt-3 flex-row gap-2">
                    <PrimaryButton
                      label="Approve & Send"
                      icon="paper-plane"
                      small
                      className="flex-1"
                      loading={send.isPending && send.variables === item.id}
                      onPress={() => send.mutate(item.id)}
                    />
                    {item.mobile ? (
                      <PrimaryButton
                        label="Call"
                        icon="call"
                        small
                        variant="outline"
                        onPress={() => Linking.openURL(`tel:${item.mobile}`)}
                      />
                    ) : null}
                    <PrimaryButton
                      label="Skip"
                      small
                      variant="ghost"
                      onPress={() => skip.mutate(item.id)}
                    />
                  </View>
                )}
              </Card>
            ))
          )}

          {others.length > 0 ? (
            <>
              <SectionTitle>Reminders</SectionTitle>
              {others.map((item) => (
                <Card key={item.id} className="mb-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 pr-2 text-[15px] font-bold text-ink" numberOfLines={1}>
                      {item.targetName}
                    </Text>
                    <Badge label={item.occasion} color={OCCASION_TINT[item.occasion] ?? colors.navy} />
                  </View>
                  <Text className="mt-2 text-xs text-muted" numberOfLines={2}>
                    {item.message}
                  </Text>
                </Card>
              ))}
            </>
          ) : null}
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  );
}
