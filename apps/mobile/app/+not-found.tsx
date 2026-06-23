import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, PrimaryButton } from '../components/ui';

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-2">
        <Text className="text-5xl">🧭</Text>
        <Text className="mt-4 text-xl font-bold text-navy">Page not found</Text>
        <Text className="mt-1 text-center text-sm text-gray-500">
          This screen doesn’t exist or the link was broken.
        </Text>
        <View className="mt-8 w-full">
          <PrimaryButton label="Go to dashboard" onPress={() => router.replace('/dashboard')} />
        </View>
      </View>
    </Screen>
  );
}
