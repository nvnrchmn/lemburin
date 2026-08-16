import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

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
        Alert.alert('Izin Galeri Diperlukan', 'Harap izinkan akses galeri untuk memilih foto bukti.');
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
