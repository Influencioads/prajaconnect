import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { Screen, ScreenHeader, Card, Badge, Avatar, PrimaryButton } from '../components/ui';
import { colors } from '../lib/theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Profile" subtitle="Your account & access" onBack={() => router.back()} />

        <View className="items-center py-4">
          <Avatar name={user?.name ?? '?'} size={80} />
          <Text className="mt-3 text-xl font-bold text-navy">{user?.name}</Text>
          <View className="mt-1">
            <Badge label={user?.roleLabel ?? ''} color={colors.navy} />
          </View>
        </View>

        <Card className="mb-3">
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="Mobile" value={user?.mobile ?? '—'} />
          <Row label="Designation" value={user?.designation ?? '—'} />
          <Row label="Language" value={user?.language ?? 'en'} />
        </Card>

        <Card className="mb-3">
          <Text className="mb-2 text-sm font-bold text-muted">Module access</Text>
          <View className="flex-row flex-wrap gap-2">
            {(user?.permissions ?? [])
              .filter((p) => p.accessLevel !== 'none')
              .map((p) => (
                <Badge key={p.module} label={`${p.module}: ${p.accessLevel}`} color={colors.muted} />
              ))}
          </View>
        </Card>

        <PrimaryButton variant="danger" icon="lock-closed" label="Sign out" onPress={onLogout} className="mb-10" />
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="max-w-[60%] text-sm font-medium text-navy">{value}</Text>
    </View>
  );
}
