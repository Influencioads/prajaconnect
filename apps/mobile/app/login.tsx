import * as React from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { apiError } from '../lib/api';
import { PrimaryButton } from '../components/ui';
import { colors } from '../lib/theme';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState('leader@praja.in');
  const [password, setPassword] = React.useState('Praja@123');
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await login(identifier, password);
      router.replace('/dashboard');
    } catch (e) {
      Alert.alert('Login failed', apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-navy">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-gold">
            <Text className="text-2xl font-bold text-navy">PC</Text>
          </View>
          <Text className="mt-4 text-2xl font-bold text-white">Praja Connect</Text>
          <Text className="mt-1 text-xs uppercase tracking-widest text-gold">Governance CRM</Text>
        </View>

        <View className="mt-10 rounded-2xl bg-white p-5">
          <Text className="text-lg font-bold text-navy">Sign in</Text>

          <Text className="mt-4 mb-1 text-sm font-medium text-gray-700">Email or Mobile</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholder="leader@praja.in"
            className="h-12 rounded-xl border border-gray-200 px-3 text-base"
          />

          <Text className="mt-4 mb-1 text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="h-12 rounded-xl border border-gray-200 px-3 text-base"
          />

          <View className="mt-6">
            <PrimaryButton label="Sign in" onPress={onSubmit} loading={loading} />
          </View>

          <Text className="mt-4 text-center text-xs text-gray-400">
            Demo: leader@praja.in / Praja@123
          </Text>
        </View>
      </KeyboardAvoidingView>
      <View style={{ height: 1, backgroundColor: colors.navy }} />
    </SafeAreaView>
  );
}
