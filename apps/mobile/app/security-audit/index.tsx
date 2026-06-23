import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { fetchSecurityLoginHistory } from '../../lib/security-audit';
import { Screen, Card, Badge, ScreenHeader } from '../../components/ui';
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
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        {(data?.data ?? []).map((entry) => (
          <Card key={entry.id} className="mb-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-navy">
                {entry.success ? 'Successful login' : 'Failed attempt'}
              </Text>
              <Badge label={entry.success ? 'OK' : 'Failed'} color={entry.success ? '#16a34a' : '#dc2626'} />
            </View>
            <Text className="mt-1 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</Text>
            {entry.ipAddress ? <Text className="text-xs text-gray-400">IP: {entry.ipAddress}</Text> : null}
          </Card>
        ))}
        {!data?.data?.length ? <Text className="text-sm text-gray-400">No login history found.</Text> : null}
      </ScrollView>
    </Screen>
  );
}
