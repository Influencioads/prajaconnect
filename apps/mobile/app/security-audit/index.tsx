import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { fetchSecurityLoginHistory } from '../../lib/security-audit';
import { Screen, Badge, ScreenHeader, ListRow, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function SecurityAuditIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['m-security-login', user?.id],
    queryFn: () => fetchSecurityLoginHistory({ page: 1, limit: 30, userId: user?.id }),
    enabled: !!user?.id,
  });

  return (
    <Screen>
      <ScreenHeader title="Security Audit" subtitle="Your login history" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {(data?.data ?? []).map((entry) => (
          <ListRow
            key={entry.id}
            title={entry.success ? 'Successful login' : 'Failed attempt'}
            subtitle={`${new Date(entry.createdAt).toLocaleString()}${entry.ipAddress ? ` · IP ${entry.ipAddress}` : ''}`}
            icon={entry.success ? 'shield-checkmark' : 'close-circle'}
            tint={entry.success ? colors.success : colors.danger}
            right={<Badge label={entry.success ? 'OK' : 'Failed'} color={entry.success ? colors.success : colors.danger} />}
          />
        ))}
        {!data?.data?.length ? (
          <EmptyState title="No login history" subtitle="Recent sign-ins will appear here." icon="finger-print" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
