import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { decideInvitation, fetchInvitations, type InvitationDecision } from '../../lib/protocol';
import { apiError } from '../../lib/api';
import {
  Screen,
  ScreenHeader,
  SectionTitle,
  Card,
  Badge,
  StatusPill,
  PrimaryButton,
  EmptyState,
  Loading,
} from '../../components/ui';
import { colors } from '../../lib/theme';

const CATEGORY_TINT: Record<string, string> = {
  Wedding: colors.violet,
  Function: colors.info,
  Opening: colors.teal,
  Festival: colors.gold,
  Other: colors.muted,
};

export default function ProtocolIndex() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['m-invitations-pending'],
    queryFn: () => fetchInvitations({ decision: 'Pending', limit: 50 }),
  });
  const { data: decided } = useQuery({
    queryKey: ['m-invitations-decided'],
    queryFn: () => fetchInvitations({ limit: 20 }),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: InvitationDecision }) =>
      decideInvitation(id, { decision }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-invitations-pending'] });
      qc.invalidateQueries({ queryKey: ['m-invitations-decided'] });
    },
    // Representative assignment needs a cadre picker — the web protocol page owns that flow.
    onError: (e) => Alert.alert('Could not save decision', apiError(e)),
  });

  const pending = data?.data ?? [];
  const recent = (decided?.data ?? []).filter((i) => i.decision !== 'Pending').slice(0, 10);

  return (
    <Screen>
      <ScreenHeader
        title="Invitations"
        subtitle="Pending decisions"
        onBack={() => router.back()}
      />
      {isLoading ? (
        <Loading label="Loading invitations…" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <PrimaryButton
            label="Log new invitation"
            icon="camera"
            onPress={() => router.push('/protocol/new' as Href)}
          />

          <SectionTitle>Awaiting decision</SectionTitle>
          {pending.length === 0 ? (
            <EmptyState title="No pending invitations" subtitle="Everything has been decided." icon="mail-open-outline" />
          ) : (
            pending.map((inv) => (
              <Card key={inv.id} className="mb-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 pr-2 text-[15px] font-bold text-ink" numberOfLines={1}>
                    {inv.eventName}
                  </Text>
                  <Badge label={inv.category} color={CATEGORY_TINT[inv.category] ?? colors.navy} />
                </View>
                <Text className="mt-1 text-xs text-muted">
                  {inv.host} · {new Date(inv.eventDate).toLocaleDateString()}
                </Text>
                {inv.venue ? (
                  <Text className="mt-0.5 text-xs text-faint" numberOfLines={1}>
                    {inv.venue}
                  </Text>
                ) : null}
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <PrimaryButton
                    label="Attend"
                    icon="checkmark-circle"
                    small
                    loading={decide.isPending && decide.variables?.id === inv.id}
                    onPress={() => decide.mutate({ id: inv.id, decision: 'Attend' })}
                  />
                  <PrimaryButton
                    label="Wishes"
                    icon="heart"
                    small
                    variant="outline"
                    onPress={() => decide.mutate({ id: inv.id, decision: 'SendWishes' })}
                  />
                  <PrimaryButton
                    label="Decline"
                    small
                    variant="ghost"
                    onPress={() => decide.mutate({ id: inv.id, decision: 'Decline' })}
                  />
                </View>
              </Card>
            ))
          )}

          {recent.length > 0 ? (
            <>
              <SectionTitle>Recently decided</SectionTitle>
              {recent.map((inv) => (
                <Card key={inv.id} className="mb-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 pr-2 text-[15px] font-bold text-ink" numberOfLines={1}>
                      {inv.eventName}
                    </Text>
                    <StatusPill status={inv.decision} />
                  </View>
                  <Text className="mt-1 text-xs text-muted">
                    {inv.host} · {new Date(inv.eventDate).toLocaleDateString()}
                  </Text>
                  {inv.representative ? (
                    <Text className="mt-0.5 text-xs text-faint">Representative: {inv.representative.name}</Text>
                  ) : null}
                  {inv.giftNotes ? <Text className="mt-0.5 text-xs text-faint">Gift: {inv.giftNotes}</Text> : null}
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
