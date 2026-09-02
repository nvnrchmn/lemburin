import Head from 'expo-router/head';
import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';

import { useToastStore } from '@/stores/toast-store';

WebBrowser.maybeCompleteAuthSession();

const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Nama lengkap minimal 2 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToastStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    // Pass the full_name to Supabase user metadata
    // We assume the backend uses this to create the profile entry
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(
        'Pendaftaran Berhasil. Jika email konfirmasi diaktifkan, silakan cek email Anda.',
        'success',
      );
    }
  };

  const onGoogleLogin = async () => {
    try {
      setIsLoading(true);

      const redirectUrl = makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Tidak mendapatkan URL OAuth dari Supabase');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const { url } = result;

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
      showToast(error.message || 'Gagal Masuk Google', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg px-5 pt-20">
      <Head>
        <title>Daftar — Lemburin</title>
      </Head>
      {/* Header */}
      <View className="mb-10">
        <Text className="text-white text-4xl font-bold tracking-tight mb-2">Buat Akun Baru</Text>
        <Text className="text-light-muted dark:text-dark-muted text-base font-medium">
          Daftar untuk mulai mencatat lembur
        </Text>
      </View>

      {/* Register Form */}
      <View className="w-full">
        <View className="bg-light-card dark:bg-dark-card rounded-3xl overflow-hidden mb-2">
          {/* Full Name Field */}
          <View
            className={`flex-row items-center px-5 py-4 border-b ${errors.fullName ? 'border-red-500/50' : 'border-light-border dark:border-dark-border'}`}
          >
            <Ionicons name="person" size={20} color="#64748b" />
            <View className="flex-1">
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="Nama Lengkap"
                    placeholderTextColor="#64748b"
                    autoCapitalize="words"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>

          {/* Email Field */}
          <View
            className={`flex-row items-center px-5 py-4 border-b ${errors.email ? 'border-red-500/50' : 'border-light-border dark:border-dark-border'}`}
          >
            <Ionicons name="mail" size={20} color="#64748b" />
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
          <View
            className={`flex-row items-center px-5 py-4 ${errors.password ? 'border-b border-red-500/50' : ''}`}
          >
            <Ionicons name="lock-closed" size={20} color="#64748b" />
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
          {(errors.fullName || errors.email || errors.password) && (
            <Text className="text-red-400 text-sm">
              {errors.fullName?.message || errors.email?.message || errors.password?.message}
            </Text>
          )}
        </View>

        <Pressable
          className={`bg-primary-600 rounded-2xl py-4 items-center mb-4 flex-row justify-center gap-2 active:opacity-70 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" size="small" /> : null}
          <Text className="text-white font-bold text-lg">Daftar</Text>
        </Pressable>

        <Pressable
          className={`bg-light-card dark:bg-dark-card rounded-2xl py-4 items-center flex-row justify-center gap-2 active:opacity-70 border border-light-border dark:border-dark-border ${isLoading ? 'opacity-50' : ''}`}
          onPress={onGoogleLogin}
          disabled={isLoading}
        >
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text className="text-white font-bold text-lg">Daftar dengan Google</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View className="flex-row mt-auto mb-10 justify-center">
        <Text className="text-light-muted dark:text-dark-muted text-base self-center">
          Sudah punya akun?{' '}
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="active:opacity-50 p-2">
            <Text className="text-primary-400 text-base font-semibold">Masuk</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
