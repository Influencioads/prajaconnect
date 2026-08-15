import * as React from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { apiError } from '../lib/api';
import { PrimaryButton, Field } from '../components/ui';
import { colors, shadow } from '../lib/theme';

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
    <LinearGradient colors={[colors.navy900, colors.navy, colors.navy700]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
              <View
                className="h-20 w-20 items-center justify-center rounded-[24px] bg-gold"
                style={shadow.raised}
              >
                <Text className="text-3xl font-extrabold text-navy">PC</Text>
              </View>
              <Text className="mt-5 text-[28px] font-extrabold tracking-tight text-white">Praja Connect</Text>
              <View className="mt-2 flex-row items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                <Ionicons name="shield-checkmark" size={12} color={colors.gold} />
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-gold">Governance CRM</Text>
              </View>
            </View>

            <View className="mt-9 rounded-[24px] bg-white p-6" style={shadow.raised}>
              <Text className="text-xl font-extrabold text-ink">Welcome back</Text>
              <Text className="mb-5 mt-1 text-sm text-muted">Sign in to your constituency workspace</Text>

              <Field
                label="Email or Mobile"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="leader@praja.in"
                icon="person-outline"
                keyboardType="email-address"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                icon="lock-closed-outline"
                secureTextEntry
              />

              <View className="mt-2">
                <PrimaryButton label="Sign in" icon="log-in-outline" onPress={onSubmit} loading={loading} />
              </View>

              <View className="mt-5 flex-row items-center justify-center gap-1.5">
                <Ionicons name="information-circle-outline" size={13} color={colors.faint} />
                <Text className="text-center text-xs text-faint">Demo: leader@praja.in / Praja@123</Text>
              </View>
            </View>

            <Text className="mt-8 text-center text-[11px] text-white/40">
              Secure field operations for constituency teams
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
