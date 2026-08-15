import * as React from 'react';
import { View, Text, ActivityIndicator, Pressable, TextInput, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, statusColor, shadow, avatarColor } from '../lib/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- layout ---------- */

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
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View className="py-4">
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-white"
          style={shadow.card}
        >
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </Pressable>
      ) : null}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[26px] font-extrabold tracking-tight text-ink">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`mb-2 mt-4 text-[11px] font-bold uppercase tracking-[1.5px] text-faint ${className ?? ''}`}>
      {children}
    </Text>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-[20px] border border-line bg-white p-4 ${className ?? ''}`} style={shadow.card}>
      {children}
    </View>
  );
}

/* ---------- icon + avatar primitives ---------- */

export function IconBubble({
  icon,
  tint = colors.navy,
  size = 40,
}: {
  icon: IconName;
  tint?: string;
  size?: number;
}) {
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: `${tint}15` }}
    >
      <Ionicons name={icon} size={size * 0.5} color={tint} />
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const bg = avatarColor(name);
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${bg}22` }}
    >
      <Text style={{ color: bg, fontWeight: '800', fontSize: size * 0.36 }}>{initials || '?'}</Text>
    </View>
  );
}

/* ---------- buttons ---------- */

type ButtonVariant = 'primary' | 'gold' | 'outline' | 'danger' | 'ghost';

const BTN_BG: Record<ButtonVariant, string> = {
  primary: colors.navy,
  gold: colors.gold,
  outline: colors.white,
  danger: colors.danger,
  ghost: 'transparent',
};
const BTN_FG: Record<ButtonVariant, string> = {
  primary: colors.white,
  gold: colors.navy,
  outline: colors.navy,
  danger: colors.white,
  ghost: colors.navy,
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  small,
  className,
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: IconName;
  small?: boolean;
  className?: string;
}) {
  const fg = BTN_FG[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      className={`flex-row items-center justify-center rounded-2xl active:opacity-80 ${small ? 'h-11 px-4' : 'h-[52px] px-5'} ${
        variant === 'outline' ? 'border border-line' : ''
      } ${className ?? ''}`}
      // ponytail: css-interop drops style *functions* when className is set — keep style as plain objects
      style={[
        { backgroundColor: BTN_BG[variant], opacity: disabled ? 0.5 : 1 },
        variant !== 'ghost' && variant !== 'outline' ? shadow.card : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={fg} style={{ marginRight: 7 }} /> : null}
          <Text style={{ color: fg }} className={`font-bold ${small ? 'text-sm' : 'text-base'}`}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------- feedback ---------- */

export function Loading({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={colors.navy} />
      {label ? <Text className="mt-3 text-sm text-muted">{label}</Text> : null}
    </View>
  );
}

/** Pulsing placeholder block for loading states. */
export function Skeleton({ height = 16, width, radius = 10, className }: { height?: number; width?: number | `${number}%`; radius?: number; className?: string }) {
  const pulse = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View className={className}>
      <Animated.View
        style={{ height, width: width ?? '100%', borderRadius: radius, backgroundColor: colors.border, opacity: pulse }}
      />
    </View>
  );
}

export function Badge({ label, color = colors.navy, dot }: { label: string; color?: string; dot?: boolean }) {
  return (
    <View
      className="flex-row items-center self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}16` }}
    >
      {dot ? <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}
      <Text className="text-xs font-bold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <Badge label={status} color={statusColor[status] ?? colors.muted} dot />;
}

export function Chip({
  label,
  active,
  onPress,
  color = colors.navy,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-3.5 py-[7px]"
      style={{
        backgroundColor: active ? color : colors.white,
        borderColor: active ? color : colors.border,
      }}
    >
      <Text className="text-xs font-bold" style={{ color: active ? colors.white : colors.muted }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- data display ---------- */

export function KpiTile({
  label,
  value,
  hint,
  accent = colors.navy,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  icon?: IconName;
}) {
  return (
    <View className="mb-3 flex-1 rounded-[20px] border border-line bg-white p-4" style={shadow.card}>
      {icon ? (
        <IconBubble icon={icon} tint={accent} size={34} />
      ) : (
        <View className="h-1.5 w-8 rounded-full" style={{ backgroundColor: accent }} />
      )}
      <Text className="mt-2.5 text-[24px] font-extrabold tracking-tight text-ink" numberOfLines={1}>
        {value}
      </Text>
      <Text className="mt-0.5 text-xs font-medium text-muted" numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text className="mt-0.5 text-[11px] text-faint" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  icon,
  tint = colors.navy,
  avatar,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  icon?: IconName;
  tint?: string;
  avatar?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mb-2.5 flex-row items-center rounded-[20px] border border-line bg-white p-3.5 active:opacity-80"
      style={shadow.card}
    >
      {avatar ? (
        <View className="mr-3">
          <Avatar name={title} size={42} />
        </View>
      ) : icon ? (
        <View className="mr-3">
          <IconBubble icon={icon} tint={tint} size={42} />
        </View>
      ) : null}
      <View className="flex-1 pr-2">
        <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.faint} style={{ marginLeft: 6 }} /> : null}
    </Pressable>
  );
}

export function MenuRow({
  label,
  description,
  onPress,
  icon,
  tint = colors.navy,
  badge,
}: {
  label: string;
  description?: string;
  onPress?: () => void;
  icon?: IconName;
  tint?: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-2.5 flex-row items-center rounded-[20px] border border-line bg-white p-3.5 active:opacity-80"
      style={shadow.card}
    >
      {icon ? (
        <View className="mr-3">
          <IconBubble icon={icon} tint={tint} size={42} />
        </View>
      ) : null}
      <View className="flex-1 pr-2">
        <Text className="text-[15px] font-bold text-ink">{label}</Text>
        {description ? <Text className="mt-0.5 text-xs text-muted">{description}</Text> : null}
      </View>
      {badge ? (
        <View className="mr-1 min-w-[22px] items-center rounded-full bg-red-500 px-1.5 py-0.5">
          <Text className="text-[11px] font-bold text-white">{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.faint} />
    </Pressable>
  );
}

/* ---------- inputs ---------- */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize = 'none',
  secureTextEntry,
  icon,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  icon?: IconName;
  error?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(!!secureTextEntry);
  const borderColor = error ? colors.danger : focused ? colors.navy : colors.border;
  return (
    <View className="mb-3.5">
      <Text className="mb-1.5 text-[13px] font-semibold text-ink">{label}</Text>
      <View
        className="flex-row items-center rounded-2xl border bg-white px-3"
        style={{ borderColor, borderWidth: focused ? 1.5 : 1 }}
      >
        {icon ? <Ionicons name={icon} size={18} color={focused ? colors.navy : colors.faint} style={{ marginRight: 8 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-base text-ink"
          style={multiline ? { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' } : { height: 50 }}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.faint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
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
    <View className="mb-3 h-12 flex-row items-center rounded-2xl border border-line bg-white px-3.5" style={shadow.card}>
      <Ionicons name="search" size={18} color={colors.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search…'}
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        className="ml-2 flex-1 text-base text-ink"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (t: T) => void;
}) {
  return (
    <View className="mb-3 flex-row rounded-2xl bg-[#E6EBF3] p-1">
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            className="flex-1 items-center rounded-xl py-2.5"
            style={active ? [{ backgroundColor: colors.white }, shadow.card] : null}
          >
            <Text className="text-[13px] font-bold" style={{ color: active ? colors.navy : colors.muted }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- empty / error ---------- */

export function EmptyState({ title, subtitle, icon = 'file-tray-outline' }: { title: string; subtitle?: string; icon?: IconName }) {
  return (
    <View className="items-center justify-center py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E6EBF3]">
        <Ionicons name={icon} size={28} color={colors.faint} />
      </View>
      <Text className="mt-4 text-base font-bold text-ink">{title}</Text>
      {subtitle ? <Text className="mt-1 px-8 text-center text-sm text-muted">{subtitle}</Text> : null}
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
      <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
      </View>
      <Text className="mt-4 text-base font-bold text-ink">{title}</Text>
      <Text className="mt-1 px-8 text-center text-sm text-muted">{subtitle}</Text>
      {onRetry ? (
        <View className="mt-5">
          <PrimaryButton label="Try again" icon="refresh" variant="outline" small onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

/* ---------- typography ---------- */

export function Title({ children }: { children: React.ReactNode }) {
  return <Text className="text-[26px] font-extrabold tracking-tight text-ink">{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text className="mt-0.5 text-sm text-muted">{children}</Text>;
}
