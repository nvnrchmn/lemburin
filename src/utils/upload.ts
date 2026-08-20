import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';

export interface PickImageResult {
  uri: string;
  base64?: string | null;
  fileSize?: number;
}

/**
 * Pick an image from gallery or camera
 */
export async function pickImage(fromCamera: boolean = false): Promise<PickImageResult | null> {
  try {
    if (fromCamera) {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin Kamera Diperlukan', 'Harap izinkan akses kamera untuk memotret bukti.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
          fileSize: asset.fileSize,
        };
      }
    } else {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Izin Galeri Diperlukan',
          'Harap izinkan akses galeri untuk memilih foto bukti.',
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
          fileSize: asset.fileSize,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Gagal', 'Terjadi kesalahan saat memilih gambar.');
    return null;
  }
}

/**
 * Pick an image then upload it to Supabase Storage.
 * Returns the public URL of the uploaded file, or null on failure.
 *
 * Bucket: `attachments` — path: `{userId}/{folder}/{timestamp}_{random}.{ext}`
 */
export async function pickAndUploadImage(
  fromCamera: boolean,
  folder: string,
): Promise<string | null> {
  const res = await pickImage(fromCamera);
  if (!res?.base64) return null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Gagal', 'Sesi login tidak ditemukan. Silakan login ulang.');
      return null;
    }

    const mimeMatch = res.base64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!mimeMatch) {
      Alert.alert('Gagal', 'Format gambar tidak didukung.');
      return null;
    }
    const mimeType = mimeMatch[1];
    const fileExt = mimeType.split('/')[1] || 'jpg';
    const fileName = `${user.id}/${folder}/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, decode(mimeMatch[2]), {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message.includes('bucket')) {
        throw new Error(
          'Bucket "attachments" belum dibuat di Supabase Storage. Harap buat terlebih dahulu.',
        );
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    Alert.alert('Gagal Mengunggah', error?.message || 'Terjadi kesalahan saat mengunggah gambar.');
    return null;
  }
}
