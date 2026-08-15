import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton, EmptyState } from '../components/ui';

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <View className="flex-1 justify-center px-2">
        <EmptyState
          icon="compass-outline"
          title="Page not found"
          subtitle="This screen doesn’t exist or the link was broken."
        />
        <PrimaryButton label="Go to dashboard" icon="home" onPress={() => router.replace('/dashboard')} />
      </View>
    </Screen>
  );
}
