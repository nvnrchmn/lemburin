import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useDataStore } from '@/stores/data-store';
import { useSettingsStore } from '@/stores/settings-store';
import { t } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const { profile, clearData } = useDataStore();
  const { language, setLanguage, currency, setCurrency, biometricEnabled, setBiometricEnabled, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();

  const handleSignOut = async () => {
    Alert.alert(t('signOut', language), 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { 
        text: 'Keluar', 
        style: 'destructive',
        onPress: async () => {
          clearData(); // clear zustand cache
          await supabase.auth.signOut();
          // The auth listener in _layout.tsx will redirect to login automatically
        }
      }
    ]);
  };

  const cycleCurrency = () => {
    const currencies: ('IDR' | 'USD' | 'EUR' | 'SGD' | 'MYR')[] = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];
    const currentIndex = currencies.indexOf(currency as any);
    const nextIndex = (currentIndex + 1) % currencies.length;
    setCurrency(currencies[nextIndex] as any);
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Tidak Didukung', 'Perangkat Anda tidak memiliki fitur biometrik atau belum diatur.');
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Otentikasi untuk mengaktifkan kunci',
      });
      
      if (result.success) {
        setBiometricEnabled(true);
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Izin Ditolak', 'Gagal mendapatkan izin untuk push notification!');
        return;
      }
      
      setNotificationsEnabled(true);
      // Scheduled a dummy notification for 5PM everyday as an example
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Sudah catat lembur hari ini? 🕒",
          body: "Jangan lupa catat jam lemburmu agar tidak hilang!",
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.DAILY, 
          hour: 17, 
          minute: 0 
        },
      });
      Alert.alert('Pengingat Aktif', 'Anda akan diingatkan setiap jam 17:00.');
    } else {
      setNotificationsEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg px-5 pt-20" showsVerticalScrollIndicator={false}>
      <View className="mb-10">
        <Text className="text-white text-5xl font-bold tracking-tight">{t('settings', language)}</Text>
      </View>

      {/* User Info Card */}
      <View className="mb-10">
        <Pressable 
          className="bg-dark-card rounded-3xl p-6 flex-row items-center active:opacity-70 shadow-sm"
          onPress={() => router.push('/profile/edit')}
        >
          <View className="w-16 h-16 rounded-2xl bg-primary-900 border border-primary-500 items-center justify-center mr-5">
            <Text className="text-primary-400 text-3xl font-bold">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold mb-1">
              {profile?.full_name || 'User'}
            </Text>
            <Text className="text-dark-muted text-sm">{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748b" />
        </Pressable>
      </View>

      {/* Settings Options */}
      <View className="space-y-8 mb-10">
        
        {/* Company Settings */}
        <View className="mb-4">
          <Text className="text-dark-muted text-xs font-bold mb-3 uppercase tracking-widest ml-5">
            {t('companySettings', language)}
          </Text>
          <View className="bg-dark-card rounded-3xl overflow-hidden shadow-sm">
            <Pressable 
              className="px-6 py-5 border-b border-dark-border flex-row justify-between items-center active:bg-dark-border"
              onPress={() => router.push('/company/setup')}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-blue-500/10 items-center justify-center mr-5">
                  <Ionicons name="business" size={20} color="#3b82f6" />
                </View>
                <Text className="text-white text-base font-medium">{t('companyProfile', language)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </Pressable>
            <Pressable 
              className="px-6 py-5 border-b border-dark-border flex-row justify-between items-center active:bg-dark-border"
              onPress={() => router.push('/pay-period/setup')}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-purple-500/10 items-center justify-center mr-5">
                  <Ionicons name="calendar" size={20} color="#a855f7" />
                </View>
                <Text className="text-white text-base font-medium">{t('payPeriod', language)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </Pressable>
            <Pressable 
              className="px-6 py-5 flex-row justify-between items-center active:bg-dark-border"
              onPress={() => router.push('/formula/select')}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-emerald-500/10 items-center justify-center mr-5">
                  <Ionicons name="calculator" size={20} color="#10b981" />
                </View>
                <Text className="text-white text-base font-medium">{t('formula', language)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </Pressable>
          </View>
        </View>

        {/* App Preferences */}
        <View className="mb-4">
          <Text className="text-dark-muted text-xs font-bold mb-3 uppercase tracking-widest ml-5">
            {t('appPreferences', language)}
          </Text>
          <View className="bg-dark-card rounded-3xl overflow-hidden shadow-sm">
            <Pressable 
              className="px-6 py-5 border-b border-dark-border flex-row justify-between items-center active:bg-dark-border"
              onPress={() => setLanguage(language === 'id' ? 'en' : 'id')}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-orange-500/10 items-center justify-center mr-5">
                  <Ionicons name="globe" size={20} color="#f97316" />
                </View>
                <Text className="text-white text-base font-medium">{t('language', language)}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-dark-muted mr-3">{language === 'id' ? 'Indonesia' : 'English'}</Text>
                <Ionicons name="swap-horizontal" size={18} color="#475569" />
              </View>
            </Pressable>
            
            <Pressable 
              className="px-6 py-5 border-b border-dark-border flex-row justify-between items-center active:bg-dark-border"
              onPress={cycleCurrency}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-yellow-500/10 items-center justify-center mr-5">
                  <Ionicons name="cash" size={20} color="#eab308" />
                </View>
                <Text className="text-white text-base font-medium">{t('currency', language)}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-dark-muted mr-3">{currency}</Text>
                <Ionicons name="swap-horizontal" size={18} color="#475569" />
              </View>
            </Pressable>

            {/* Note: In a real app we would read this from the settings store. We'll add UI for it. */}
            <Pressable 
              className="px-6 py-5 flex-row justify-between items-center active:bg-dark-border"
              onPress={() => Alert.alert('Info', 'Fitur pergantian tema manual (Light/Dark) akan hadir pada update mendatang. Saat ini mengikuti preferensi sistem.')}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-indigo-500/10 items-center justify-center mr-5">
                  <Ionicons name="moon" size={20} color="#6366f1" />
                </View>
                <Text className="text-white text-base font-medium">{t('theme', language)}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-dark-muted mr-3">System default</Text>
                <Ionicons name="chevron-forward" size={20} color="#475569" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Keamanan & Notifikasi */}
        <View className="mb-4">
          <Text className="text-dark-muted text-xs font-bold mb-3 uppercase tracking-widest ml-5">
            Keamanan & Pengingat
          </Text>
          <View className="bg-dark-card rounded-3xl overflow-hidden shadow-sm">
            <View className="px-6 py-5 border-b border-dark-border flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-cyan-500/10 items-center justify-center mr-5">
                  <Ionicons name="finger-print" size={20} color="#06b6d4" />
                </View>
                <Text className="text-white text-base font-medium">Kunci Biometrik</Text>
              </View>
              <Switch
                trackColor={{ false: '#334155', true: '#3b82f6' }}
                thumbColor={'#fff'}
                ios_backgroundColor="#334155"
                onValueChange={toggleBiometric}
                value={biometricEnabled}
              />
            </View>
            
            <View className="px-6 py-5 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-pink-500/10 items-center justify-center mr-5">
                  <Ionicons name="notifications" size={20} color="#ec4899" />
                </View>
                <Text className="text-white text-base font-medium">Pengingat Harian (17:00)</Text>
              </View>
              <Switch
                trackColor={{ false: '#334155', true: '#3b82f6' }}
                thumbColor={'#fff'}
                ios_backgroundColor="#334155"
                onValueChange={toggleNotifications}
                value={notificationsEnabled}
              />
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mt-6 space-y-4">
          <Pressable 
            className="bg-red-500/10 rounded-2xl px-6 py-5 flex-row justify-center items-center active:opacity-70 shadow-sm"
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={20} color="#f87171" style={{ marginRight: 10 }} />
            <Text className="text-red-400 font-bold text-lg">{t('signOut', language)}</Text>
          </Pressable>
        </View>

        <View className="items-center mt-6 mb-12">
          <Text className="text-dark-muted text-xs font-medium tracking-widest uppercase">Lemburin App v1.1.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}
