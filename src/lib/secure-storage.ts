import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage adapter yang menyimpan data SENSITIF (profil, employment, gaji,
 * periode, entri lembur) ke expo-secure-store alih-alih AsyncStorage plaintext.
 *
 * Mengapa: AsyncStorage disimpan sebagai plaintext di filesystem perangkat.
 * Kalau HP di-root, di-backup, atau di-sync ke iCloud, data gaji & identitas
 * pengguna bisa bocor. expo-secure-store memakai Keychain (iOS) / Keystore
 * (Android) yang dienkripsi di level OS.
 *
 * Catatan: SecureStore punya batas ukuran per-item (~2KB di beberapa device),
 * tapi data lembur per-periode relatif kecil sehingga aman untuk kasus ini.
 * Bila suatu saat payload membesar, pisahkan ke cache AsyncStorage non-sensitif
 * + simpan hanya ID/flags di SecureStore.
 */

const STATE_KEY = 'lemburin-data-store';

export const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // Coba ambil dari SecureStore dulu
      const secured = await SecureStore.getItemAsync(STATE_KEY);
      if (secured) return secured;
      // Fallback: migrasi dari AsyncStorage lama (jika ada)
      const legacy = await AsyncStorage.getItem(name);
      if (legacy) {
        await SecureStore.setItemAsync(STATE_KEY, legacy);
        await AsyncStorage.removeItem(name);
        return legacy;
      }
      return null;
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // Hapus salinan plaintext lama (jika ada) agar tidak dobel
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      /* ignore */
    }
    await SecureStore.setItemAsync(STATE_KEY, value);
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      /* ignore */
    }
    await SecureStore.deleteItemAsync(STATE_KEY);
  },
};
