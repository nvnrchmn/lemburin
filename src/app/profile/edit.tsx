import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { useDataStore } from '@/stores/data-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';

const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'Nama lengkap minimal 2 karakter' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditScreen() {
  const { user } = useAuthStore();
  const { profile, setProfile } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || user?.user_metadata?.full_name || '',
    },
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsLoading(true);
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        const fileExt = mimeType.split('/')[1] || 'jpg';
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;

        // Ensure "avatars" bucket exists in Supabase, otherwise this will throw error
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(result.assets[0].base64), {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          if (uploadError.message.includes('bucket')) {
            throw new Error(
              'Bucket "avatars" belum dibuat di Supabase Storage Anda. Harap buat terlebih dahulu.',
            );
          }
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName);

        setAvatarUrl(publicUrl);
        Alert.alert('Berhasil', 'Foto berhasil diunggah. Jangan lupa klik Simpan Profil.');
      }
    } catch (error: any) {
      Alert.alert('Gagal Mengunggah', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      // Menggunakan upsert berdasarkan user_id agar aman jika tabel pernah dihapus
      const payload = {
        user_id: user.id,
        full_name: data.fullName,
        avatar_url: avatarUrl,
        ...(profile?.id ? { id: profile.id } : {}), // opsional: tambahkan id jika ada
      };

      // Hapus id dari payload jika ternyata data di DB tidak punya id tersebut (conflict resolution fallback)
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        // @ts-ignore
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setProfile(updatedProfile);
      Alert.alert('Berhasil', 'Profil telah diperbarui', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Gagal Memperbarui', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg px-5 pt-6" showsVerticalScrollIndicator={false}>
      <Text className="text-dark-muted text-sm mb-6 ml-1 font-medium">
        Perbarui informasi profil Anda
      </Text>

      {/* Avatar Section */}
      <View className="items-center mb-8">
        <Pressable
          onPress={pickImage}
          className="w-28 h-28 bg-dark-card border-2 border-primary-500/50 rounded-full items-center justify-center overflow-hidden mb-3 active:opacity-70"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-full h-full" />
          ) : (
            <Ionicons name="camera" size={32} color="#3b82f6" />
          )}
        </Pressable>
        <Text className="text-primary-400 font-medium text-sm">Ubah Foto</Text>
      </View>

      <View className="w-full">
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Informasi Dasar
        </Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Full Name Field */}
          <View
            className={`flex-row items-center px-5 py-4 border-b ${errors.fullName ? 'border-red-500/50' : 'border-dark-border'}`}
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
                  />
                )}
              />
            </View>
          </View>

          {/* Read-only timezone */}
          <View className="flex-row items-center px-5 py-4 opacity-50">
            <Ionicons name="globe" size={20} color="#64748b" />
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-white text-base">Zona Waktu</Text>
              <Text className="text-dark-muted">{profile?.timezone || 'Asia/Jakarta'}</Text>
            </View>
          </View>
        </View>

        {errors.fullName && (
          <Text className="text-red-400 text-sm ml-4 mb-4">{errors.fullName.message}</Text>
        )}

        <Pressable
          className={`bg-primary-600 rounded-2xl py-4 items-center mb-10 flex-row justify-center gap-2 active:opacity-70 ${
            isLoading ? 'opacity-50' : ''
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading && <ActivityIndicator color="#fff" size="small" />}
          <Text className="text-white font-bold text-lg">Simpan Profil</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
