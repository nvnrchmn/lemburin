import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(value === 'true');
      } catch {
        setHasSeenOnboarding(false);
      }
    }
    checkOnboarding();
  }, []);

  if (isLoading || hasSeenOnboarding === null) {
    return null; // Splash screen is still visible
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(auth)/login" />;
}
