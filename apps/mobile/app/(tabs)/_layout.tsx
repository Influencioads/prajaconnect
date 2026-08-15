import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import type { IconName } from '../../components/ui';

function TabIcon({ icon, iconActive, focused }: { icon: IconName; iconActive: IconName; focused: boolean }) {
  return (
    <View
      className="h-9 w-14 items-center justify-center rounded-full"
      style={{ backgroundColor: focused ? `${colors.navy}12` : 'transparent' }}
    >
      <Ionicons name={focused ? iconActive : icon} size={21} color={focused ? colors.navy : colors.faint} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          height: 66,
          paddingBottom: 9,
          paddingTop: 7,
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          elevation: 12,
          shadowColor: colors.navy900,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="home-outline" iconActive="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="grievances"
        options={{
          title: 'Grievances',
          tabBarIcon: ({ focused }) => <TabIcon icon="megaphone-outline" iconActive="megaphone" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
          tabBarIcon: ({ focused }) => <TabIcon icon="people-outline" iconActive="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => <TabIcon icon="grid-outline" iconActive="grid" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
