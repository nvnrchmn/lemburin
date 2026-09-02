import Head from 'expo-router/head';
import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { supabase } from '@/lib/supabase';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      // Typically you'd provide a redirect URL here for deep linking
      // redirectTo: 'lemburin://reset-password',
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Gagal Mengirim Link', error.message);
    } else {
      setIsSuccess(true);
      Alert.alert(
        'Berhasil',
        'Link reset password telah dikirim ke email Anda. Silakan periksa inbox atau folder spam.',
      );
    }
  };

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg justify-center px-6">
      <Head>
        <title>Lupa Kata Sandi — Lemburin</title>
      </Head>
      {/* Header */}
      <View className="items-center mb-10">
        <Text className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">
          Lupa Password
        </Text>
        <Text className="text-light-muted dark:text-dark-muted text-center">
          Masukkan email untuk reset password
        </Text>
      </View>

      {/* Form */}
      <View className="w-full space-y-4">
        <View>
          <View
            className={`bg-light-card dark:bg-dark-card border rounded-xl px-4 py-1 flex-row items-center ${errors.email ? 'border-red-500' : 'border-light-border dark:border-dark-border'}`}
          >
            <View className="flex-1 py-1.5">
              <Text className="text-light-muted dark:text-dark-muted text-xs mb-0.5">Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-light-text dark:text-dark-text text-base p-0 m-0"
                    placeholder="user@email.com"
                    placeholderTextColor="#60646C"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading && !isSuccess}
                  />
                )}
              />
            </View>
          </View>
          {errors.email && (
            <Text className="text-red-400 text-xs mt-1.5 ml-1">{errors.email.message}</Text>
          )}
        </View>

        <Pressable
          className={`bg-primary-600 rounded-xl py-4 items-center mt-6 flex-row justify-center gap-2 ${isLoading || isSuccess ? 'opacity-70' : 'active:bg-primary-700'}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading || isSuccess}
        >
          {isLoading && <ActivityIndicator color="#fff" size="small" />}
          <Text className="text-white font-semibold text-base">
            {isSuccess ? 'Link Terkirim' : 'Kirim Link Reset'}
          </Text>
        </Pressable>
      </View>

      {/* Back to Login */}
      <Link href="/(auth)/login" asChild>
        <Pressable className="mt-8 self-center">
          <Text className="text-primary-400 text-sm">← Kembali ke Login</Text>
        </Pressable>
      </Link>
    </View>
  );
}
