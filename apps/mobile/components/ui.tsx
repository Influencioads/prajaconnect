import * as React from 'react';
import { View, Text, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, statusColor } from '../lib/theme';

export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className={`flex-1 px-4 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <View className="py-4">
      {onBack ? (
        <Pressable onPress={onBack} className="mb-1 self-start">
          <Text className="text-base font-semibold text-navy">‹ Back</Text>
        </Pressable>
      ) : null}
      <Text className="text-2xl font-bold text-navy">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-sm text-gray-500">{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-gray-200 bg-white p-4 ${className ?? ''}`}>
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="h-12 items-center justify-center rounded-xl bg-navy active:opacity-90"
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text className="text-base font-bold text-white">{label}</Text>
      )}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={colors.navy} />
    </View>
  );
}

export function Badge({ label, color = colors.navy }: { label: string; color?: string }) {
  return (
    <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}22` }}>
      <Text className="text-xs font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <Badge label={status} color={statusColor[status] ?? colors.muted} />;
}

export function KpiTile({
  label,
  value,
  hint,
  accent = colors.navy,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <View className="mb-3 flex-1 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="h-1.5 w-8 rounded-full" style={{ backgroundColor: accent }} />
      <Text className="mt-2 text-2xl font-bold text-navy">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
      {hint ? <Text className="mt-0.5 text-[11px] text-gray-400">{hint}</Text> : null}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 active:opacity-80"
    >
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold text-navy" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        className="rounded-xl border border-gray-200 bg-white px-3 text-base"
        style={multiline ? { minHeight: 88, paddingTop: 10, textAlignVertical: 'top' } : { height: 48 }}
      />
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? 'Search…'}
      autoCapitalize="none"
      className="mb-3 h-11 rounded-xl border border-gray-200 bg-white px-3 text-base"
    />
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="items-center justify-center py-16">
      <Text className="text-base font-semibold text-gray-500">{title}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-gray-400">{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorState({
  title = 'Couldn’t load this',
  subtitle = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center justify-center py-16">
      <Text className="text-base font-semibold text-gray-600">{title}</Text>
      <Text className="mt-1 text-center text-sm text-gray-400">{subtitle}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} className="mt-4 rounded-xl border border-gray-300 px-5 py-2.5 active:opacity-80">
          <Text className="text-sm font-semibold text-navy">Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text className="text-2xl font-bold text-navy">{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text className="mt-0.5 text-sm text-gray-500">{children}</Text>;
}

export function MenuRow({
  label,
  description,
  onPress,
}: {
  label: string;
  description?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 active:opacity-80"
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-navy">{label}</Text>
        {description ? <Text className="mt-0.5 text-xs text-gray-500">{description}</Text> : null}
      </View>
      <Text className="text-xl text-gray-300">›</Text>
    </Pressable>
  );
}
