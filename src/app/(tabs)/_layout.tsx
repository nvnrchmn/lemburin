import { Tabs, Redirect } from 'expo-router';
import { Text, View , useColorScheme } from 'react-native';

import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const scheme = useColorScheme();
  // Ambil palet yang konsisten dengan tema aktif. App didesain dark-first,
  // tapi tetap ikut preferensi sistem agar tidak "broken" di light mode.
  const dark = scheme === 'dark' || scheme === 'unspecified' || !scheme;
  const tabBg = dark ? Colors.dark.card : Colors.light.card;
  const tabBorder = dark ? Colors.dark.border : Colors.light.border;
  const tabMuted = dark ? Colors.dark.muted : Colors.light.muted;
  const tabText = dark ? Colors.dark.text : Colors.light.text;

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const tabBarStyle = {
    backgroundColor: tabBg,
    borderTopColor: tabBorder,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  };
  const headerStyle = {
    backgroundColor: dark ? Colors.dark.bg : Colors.light.bg,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: tabMuted,
        tabBarStyle,
        headerStyle,
        headerTintColor: tabText,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-overtime"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                backgroundColor: Colors.primary[600],
                width: 52,
                height: 52,
                borderRadius: 26,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: Colors.primary[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Pengaturan',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
