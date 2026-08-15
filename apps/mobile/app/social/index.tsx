import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  approveSocialPost,
  fetchRivalMentions,
  fetchSocialPosts,
  rejectSocialPost,
} from '../../lib/social';
import { apiError } from '../../lib/api';
import {
  Screen,
  ScreenHeader,
  Card,
  Badge,
  PrimaryButton,
  SectionTitle,
  EmptyState,
  StatusPill,
} from '../../components/ui';
import { colors } from '../../lib/theme';

function sentimentColor(sentiment?: string | null) {
  const s = (sentiment ?? '').toLowerCase();
  if (s.includes('positive')) return colors.success;
  if (s.includes('negative')) return colors.danger;
  return colors.muted;
}

export default function SocialIndex() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: pending } = useQuery({
    queryKey: ['m-social-pending'],
    queryFn: () => fetchSocialPosts({ page: 1, limit: 20, status: 'PendingApproval' }),
  });

  const { data: mentions } = useQuery({
    queryKey: ['m-rival-mentions'],
    queryFn: () => fetchRivalMentions({ page: 1, limit: 15 }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['m-social-pending'] });
  };

  const approve = useMutation({
    mutationFn: approveSocialPost,
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const reject = useMutation({
    mutationFn: rejectSocialPost,
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const pendingPosts = pending?.data ?? [];
  const rivalMentions = mentions?.data ?? [];

  return (
    <Screen>
      <ScreenHeader title="Social Media" subtitle="Post approvals & rival mentions" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle>Pending approvals</SectionTitle>
        {pendingPosts.length === 0 && (
          <EmptyState title="Nothing to approve" subtitle="Pending posts will show up here." icon="checkmark-done-outline" />
        )}
        {pendingPosts.map((post) => (
          <Card key={post.id} className="mb-2">
            <View className="mb-1 flex-row items-center justify-between">
              <Badge label={post.platform} color={colors.info} />
              <StatusPill status={post.status} />
            </View>
            <Text className="text-sm text-ink">{post.content}</Text>
            {post.scheduledAt && (
              <Text className="mt-1 text-xs text-muted">
                Scheduled: {new Date(post.scheduledAt).toLocaleString()}
              </Text>
            )}
            <View className="mt-2 flex-row gap-2">
              <View className="flex-1">
                <PrimaryButton
                  label={approve.isPending ? 'Approving…' : 'Approve'}
                  icon="checkmark"
                  onPress={() => approve.mutate(post.id)}
                  loading={approve.isPending}
                />
              </View>
              <View className="flex-1">
                <PrimaryButton
                  variant="gold"
                  label="Reject"
                  icon="close"
                  onPress={() => reject.mutate(post.id)}
                  loading={reject.isPending}
                />
              </View>
            </View>
          </Card>
        ))}

        <SectionTitle>Rival mentions</SectionTitle>
        {rivalMentions.length === 0 && (
          <EmptyState title="No rival mentions yet" subtitle="Detected mentions from the news cycle appear here." icon="people-outline" />
        )}
        {rivalMentions.map((m) => (
          <Card key={m.id} className="mb-2">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="font-semibold text-ink">{m.rival.name}</Text>
              <Badge label={m.sentiment} color={sentimentColor(m.sentiment)} />
            </View>
            <Text className="text-sm text-muted" numberOfLines={2}>{m.article.title}</Text>
            {m.quote ? (
              <Text className="mt-1 text-xs italic text-muted" numberOfLines={2}>“{m.quote}”</Text>
            ) : null}
            <Text className="mt-1 text-xs text-faint">
              {m.article.source ?? 'Unknown source'} · {new Date(m.createdAt).toLocaleDateString()}
            </Text>
          </Card>
        ))}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
