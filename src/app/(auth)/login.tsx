import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';

import { useToastStore } from '@/stores/toast-store';

WebBrowser.maybeCompleteAuthSession();

const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToastStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    setIsLoading(false);

    if (error) {
      showToast(error.message, 'error');
    }
  };

  const onGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Secara eksplisit menggunakan scheme URL
      const redirectUrl = 'lemburin://';
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We will manually open it
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Tidak mendapatkan URL OAuth dari Supabase');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const { url } = result;
        
        // Parse access_token and refresh_token from the hash
        const params: Record<string, string> = {};
        const queryString = url.split('#')[1] || url.split('?')[1];
        if (queryString) {
          queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[key] = decodeURIComponent(value);
          });
        }

        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          
          if (sessionError) throw sessionError;
        } else if (params.error_description) {
          throw new Error(params.error_description);
        }
      }
    } catch (error: any) {
      if (error.message?.includes('provider is not enabled') || error.message?.includes('redirect_uri_mismatch')) {
        Alert.alert(
          'Konfigurasi Belum Selesai',
          `Google Login belum diaktifkan di Supabase.\n\n1. Buka Supabase Dashboard > Authentication > Providers > Google\n2. Masukkan Client ID & Secret dari Google Cloud.\n3. Tambahkan URL ini ke Redirect URLs:\n\nlemburin://**`,
          [{ text: 'Mengerti' }]
        );
      } else {
        showToast(error.message || 'Gagal Masuk Google', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-dark-bg px-5 pt-20">
      {/* Header */}
      <View className="mb-12">
        <Text className="text-white text-5xl font-bold tracking-tight mb-2">
          Masuk
        </Text>
        <Text className="text-dark-muted text-base font-medium">
          Silakan masuk untuk melanjutkan ke Lemburin.
        </Text>
      </View>

      {/* Login Form Grouped */}
      <View className="w-full">
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-2">
          {/* Email Field */}
          <View className={`flex-row items-center px-5 py-4 border-b ${errors.email ? 'border-red-500/50' : 'border-dark-border'}`}>
            <SymbolView name="envelope.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
            <View className="flex-1">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="user@email.com"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>

          {/* Password Field */}
          <View className={`flex-row items-center px-5 py-4 ${errors.password ? 'border-b border-red-500/50' : ''}`}>
            <SymbolView name="lock.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
            <View className="flex-1">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="Password"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>
        </View>
        
        {/* Error Messages */}
        <View className="min-h-[24px] px-5 mb-4">
          {(errors.email || errors.password) && (
            <Text className="text-red-400 text-sm">
              {errors.email?.message || errors.password?.message}
            </Text>
          )}
        </View>

        <Pressable
          className={`bg-primary-600 rounded-2xl py-4 items-center mb-4 flex-row justify-center gap-2 active:opacity-70 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" size="small" /> : null}
          <Text className="text-white font-bold text-lg">Masuk</Text>
        </Pressable>

        <Pressable 
          className={`bg-dark-card rounded-2xl py-4 items-center flex-row justify-center gap-2 active:opacity-70 border border-dark-border ${isLoading ? 'opacity-50' : ''}`}
          onPress={onGoogleLogin}
          disabled={isLoading}
        >
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text className="text-white font-bold text-lg">
            Lanjutkan dengan Google
          </Text>
        </Pressable>
      </View>

      {/* Footer Links */}
      <View className="flex-row mt-auto mb-10 gap-4 justify-center">
        <Link href="/(auth)/register" asChild>
          <Pressable className="active:opacity-50 p-2">
            <Text className="text-primary-400 font-semibold text-base">Buat Akun</Text>
          </Pressable>
        </Link>
        <Text className="text-dark-muted self-center">|</Text>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable className="active:opacity-50 p-2">
            <Text className="text-primary-400 font-semibold text-base">Lupa Password</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
