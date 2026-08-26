import '../global.css';
import { useEffect, useState, useRef } from 'react';
import { ThemeProvider, DarkTheme, DefaultTheme, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, View, Text, Pressable, Platform } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Toast } from '@/components/ui/toast';
import { Ionicons } from '@expo/vector-icons';
import { syncService } from '@/services/sync-service';
import { initNetworkListener } from '@/stores/data-store';
import { useAppTheme } from '@/hooks/use-app-theme';

const isWeb = Platform.OS === 'web' || process.env.EXPO_OS === 'web';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { resolvedTheme, colors } = useAppTheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const { setSession, setLoading } = useAuthStore();
  const { biometricEnabled } = useSettingsStore();
  const [isUnlocked, setIsUnlocked] = useState(!biometricEnabled || isWeb);
  const appState = useRef(AppState.currentState);

  const [fontsLoaded] = [true];

  useEffect(() => {
    // Never let a theme call crash the whole app (it renders nothing at all).
    try {
      setColorScheme(resolvedTheme);
    } catch (e) {
      console.warn('setColorScheme failed:', e);
    }
  }, [resolvedTheme, setColorScheme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && !isWeb) {
        syncService();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && !isWeb) {
        syncService();
      }
    });

    initNetworkListener();

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setLoading]);

  useEffect(() => {
    if (fontsLoaded && !isWeb) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (biometricEnabled && !isUnlocked && !isWeb) {
      const timer = setTimeout(() => {
        (async () => {
          const { default: LocalAuthentication } = await import('expo-local-authentication');
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Buka Lemburin',
              fallbackLabel: 'Gunakan PIN',
            });
            setIsUnlocked(result.success);
          } else {
            setIsUnlocked(true);
          }
        })();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [biometricEnabled, isUnlocked]);

  useEffect(() => {
    if (isWeb) return;
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        biometricEnabled
      ) {
        setIsUnlocked(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [biometricEnabled]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="overtime/add"
          options={{ headerShown: true, title: 'Tambah Lembur', presentation: 'modal' }}
        />
        <Stack.Screen
          name="overtime/edit/[id]"
          options={{ headerShown: true, title: 'Edit Lembur', presentation: 'modal' }}
        />
        <Stack.Screen
          name="overtime/[id]"
          options={{ headerShown: true, title: 'Detail Lembur' }}
        />
        <Stack.Screen
          name="company/setup"
          options={{ headerShown: true, title: 'Profil Perusahaan' }}
        />
        <Stack.Screen
          name="pay-period/setup"
          options={{ headerShown: true, title: 'Periode Gaji' }}
        />
        <Stack.Screen
          name="formula/select"
          options={{ headerShown: true, title: 'Pilih Formula' }}
        />
        <Stack.Screen
          name="summary/[periodId]"
          options={{ headerShown: true, title: 'Ringkasan Bulanan' }}
        />
        <Stack.Screen
          name="verification/[periodId]"
          options={{ headerShown: true, title: 'Verifikasi Gaji' }}
        />
        <Stack.Screen name="profile/edit" options={{ headerShown: true, title: 'Edit Profil' }} />
        <Stack.Screen
          name="analytics/yearly"
          options={{ headerShown: true, title: 'Analitik Tahunan' }}
        />
      </Stack>
      <Toast />
      <StatusBar style="auto" />

      {biometricEnabled && !isUnlocked && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: colors.background }}
        >
          <View className="w-20 h-20 bg-primary-900/30 rounded-full items-center justify-center mb-6">
            <Ionicons name="lock-closed" size={40} color="#3b82f6" />
          </View>
          <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Aplikasi Terkunci
          </Text>
          <Text className="text-center max-w-[250px] mb-10" style={{ color: colors.muted }}>
            Gunakan otentikasi biometrik untuk membuka aplikasi Lemburin
          </Text>
          <Pressable
            className="bg-primary-600 active:bg-primary-700 px-8 py-4 rounded-2xl flex-row items-center shadow-lg shadow-primary-900/50"
            onPress={() => setIsUnlocked(true)}
          >
            <Ionicons name="scan" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text className="text-white font-bold text-lg">Buka Kunci</Text>
          </Pressable>
        </View>
      )}
    </ThemeProvider>
  );
}
