import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { FORMULA_TYPES } from '@/constants/config';
import { FormulaType } from '@/types/database';
import { useAuthStore } from '@/stores/auth-store';
import { useDataStore } from '@/stores/data-store';
import { supabase } from '@/lib/supabase';
import { SymbolView } from 'expo-symbols';

export default function FormulaSelectScreen() {
  const formulas = Object.values(FORMULA_TYPES);
  
  const { user } = useAuthStore();
  const { activePayPeriod, setActivePayPeriod } = useDataStore();
  
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>(
    activePayPeriod?.formula_type || 'indonesia'
  );
  const [isLoading, setIsLoading] = useState(false);

  const onSave = async () => {
    if (!user) return;
    
    if (!activePayPeriod?.id) {
      Alert.alert('Perhatian', 'Harap atur Periode Gaji terlebih dahulu sebelum memilih formula.', [
        { text: 'Atur Periode', onPress: () => router.push('/pay-period/setup') },
        { text: 'Batal', style: 'cancel' }
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('pay_periods')
        // @ts-ignore
        .update({ formula_type: selectedFormula } as any)
        .eq('id', activePayPeriod.id)
        .select()
        .single();

      if (error) throw error;
      
      setActivePayPeriod(data);
      Alert.alert('Berhasil', 'Formula perhitungan telah disimpan', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg px-5 pt-6" showsVerticalScrollIndicator={false}>
      <Text className="text-dark-muted text-sm mb-6 ml-1 font-medium">
        Pilih metode perhitungan lembur yang sesuai dengan kebijakan perusahaan Anda.
      </Text>

      <View className="w-full">
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Formula Lembur</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {formulas.map((formula, index) => {
            const isSelected = selectedFormula === formula.id;
            const isLast = index === formulas.length - 1;
            
            return (
              <Pressable
                key={formula.id}
                onPress={() => setSelectedFormula(formula.id as FormulaType)}
                className={`px-5 py-4 flex-row justify-between items-center active:bg-dark-border ${!isLast ? 'border-b border-dark-border' : ''}`}
              >
                <View className="flex-1">
                  <Text className={`text-base font-medium mb-1 ${isSelected ? 'text-primary-400' : 'text-white'}`}>
                    {formula.label}
                  </Text>
                  <Text className="text-dark-muted text-xs mr-4">
                    {formula.description}
                  </Text>
                </View>
                {isSelected && (
                  <SymbolView name="checkmark" size={20} tintColor="#3b82f6" weight="bold" />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Dasar Perhitungan (Simulasi)</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6 p-5">
          {selectedFormula === 'indonesia' && (
            <View>
              <Text className="text-white text-base font-bold mb-2">Formula Kemenaker RI</Text>
              <View className="bg-dark-bg p-4 rounded-xl border border-dark-border mb-3">
                <Text className="text-primary-400 font-mono text-sm leading-6">
                  Upah Sejam = (Gaji Pokok + Tunjangan Tetap) ÷ 173
                </Text>
              </View>
              <Text className="text-dark-muted text-sm leading-5">
                • Jam ke-1: Upah Sejam × 1.5{'\n'}
                • Jam ke-2 dst: Upah Sejam × 2{'\n'}
                • Hari Libur: Berbeda (2x, 3x, 4x)
              </Text>
            </View>
          )}

          {selectedFormula === 'flat_rate' && (
            <View>
              <Text className="text-white text-base font-bold mb-2">Tarif Flat</Text>
              <View className="bg-dark-bg p-4 rounded-xl border border-dark-border mb-3">
                <Text className="text-primary-400 font-mono text-sm leading-6">
                  Total = Tarif Flat per Jam × Durasi (Jam)
                </Text>
              </View>
              <Text className="text-dark-muted text-sm leading-5">
                Nilai tarif per jam ditetapkan sendiri pada menu pengaturan periode tanpa mengikuti standar Kemenaker.
              </Text>
            </View>
          )}
          
          {selectedFormula === 'custom' && (
            <View>
              <Text className="text-white text-base font-bold mb-2">Kustomisasi</Text>
              <Text className="text-dark-muted text-sm leading-5">
                Formula ini akan disesuaikan secara khusus sesuai dengan kontrak perusahaan Anda (segera hadir).
              </Text>
            </View>
          )}
        </View>

        <Pressable
          className={`bg-primary-600 rounded-2xl py-4 items-center mb-10 flex-row justify-center gap-2 active:opacity-70 ${
            isLoading ? 'opacity-50' : ''
          }`}
          onPress={onSave}
          disabled={isLoading}
        >
          {isLoading && <ActivityIndicator color="#fff" size="small" />}
          <Text className="text-white font-bold text-lg">Simpan Formula</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
