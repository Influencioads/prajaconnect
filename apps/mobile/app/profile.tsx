import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { Screen, ScreenHeader, Card, Badge } from '../components/ui';
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
        <ScreenHeader title="Profile" onBack={() => router.back()} />

        <View className="items-center py-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-navy">
            <Text className="text-2xl font-bold text-white">
              {user?.name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
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
          <Text className="mb-2 text-sm font-bold text-gray-500">Module access</Text>
          <View className="flex-row flex-wrap gap-2">
            {(user?.permissions ?? [])
              .filter((p) => p.accessLevel !== 'none')
              .map((p) => (
                <Badge key={p.module} label={`${p.module}: ${p.accessLevel}`} color={colors.muted} />
              ))}
          </View>
        </Card>

        <Pressable
          onPress={onLogout}
          className="h-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 active:opacity-80"
        >
          <Text className="font-bold text-red-600">Sign out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="max-w-[60%] text-sm font-medium text-navy">{value}</Text>
    </View>
  );
}
