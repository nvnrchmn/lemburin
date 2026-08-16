import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SymbolView } from 'expo-symbols';

import { PAY_PERIOD_PRESETS } from '@/constants/config';
import { useAuthStore } from '@/stores/auth-store';
import { useDataStore } from '@/stores/data-store';
import { supabase } from '@/lib/supabase';

function calculatePeriodDates(startDay: number) {
  const today = new Date();
  const currentDay = today.getDate();
  
  let startMonth = today.getMonth();
  let startYear = today.getFullYear();
  let endMonth = today.getMonth();
  let endYear = today.getFullYear();
  
  if (currentDay < startDay) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  } else {
    endMonth += 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
  }
  
  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(endYear, endMonth, startDay - 1);
  const periodName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(endDate);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    periodName
  };
}

export default function PayPeriodSetupScreen() {
  const { user } = useAuthStore();
  const { employment, activePayPeriod, setActivePayPeriod } = useDataStore();
  
  const [selectedDay, setSelectedDay] = useState<number | 'custom' | null>(null);
  
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [formulaType, setFormulaType] = useState<'indonesia' | 'flat_rate' | 'custom'>('indonesia');
  const [flatRate, setFlatRate] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (activePayPeriod?.start_date) {
      const startObj = new Date(activePayPeriod.start_date);
      const endObj = new Date(activePayPeriod.end_date);
      const diffDays = Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 3600 * 24));
      
      const day = startObj.getDate();
      
      // We use a short timeout to prevent synchronous state updates inside the effect
      timeoutId = setTimeout(() => {
        if (diffDays >= 27 && diffDays <= 31) {
          setSelectedDay(day);
        } else {
          setSelectedDay('custom');
          setCustomStart(startObj);
          setCustomEnd(endObj);
        }
        setFormulaType(activePayPeriod.formula_type || 'indonesia');
        if (activePayPeriod.flat_rate_amount) {
          setFlatRate(String(activePayPeriod.flat_rate_amount));
        }
      }, 0);
    } else {
      timeoutId = setTimeout(() => {
        setSelectedDay(PAY_PERIOD_PRESETS[0].startDay);
      }, 0);
    }

    return () => clearTimeout(timeoutId);
  }, [activePayPeriod]);

  const onSave = async () => {
    if (!user) return;
    if (!employment?.id) {
      Alert.alert('Perhatian', 'Anda harus mengisi profil perusahaan terlebih dahulu.', [
        { text: 'Isi Profil Perusahaan', onPress: () => router.push('/company/setup') },
        { text: 'Batal', style: 'cancel' }
      ]);
      return;
    }
    if (!selectedDay) return;

    setIsLoading(true);
    
    let startDateStr, endDateStr, periodName;
    
    if (selectedDay === 'custom') {
      startDateStr = customStart.toISOString().split('T')[0];
      endDateStr = customEnd.toISOString().split('T')[0];
      periodName = `Kustom: ${format(customStart, 'MMM')} - ${format(customEnd, 'MMM yyyy')}`;
    } else {
      const dates = calculatePeriodDates(selectedDay as number);
      startDateStr = dates.startDate;
      endDateStr = dates.endDate;
      periodName = dates.periodName;
    }
    
    const payload = {
      employment_id: employment.id,
      period_name: periodName,
      start_date: startDateStr,
      end_date: endDateStr,
      formula_type: formulaType,
      flat_rate_amount: formulaType === 'flat_rate' ? parseFloat(flatRate) || null : null,
      is_locked: false,
    };

    try {
      let response;
      if (activePayPeriod?.id) {
        response = await supabase
          .from('pay_periods')
          // @ts-ignore
          .update(payload as any)
          .eq('id', activePayPeriod.id)
          .select()
          .single();
      } else {
        response = await supabase
          .from('pay_periods')
          // @ts-ignore
          .insert(payload as any)
          .select()
          .single();
      }

      if (response.error) throw response.error;
      
      setActivePayPeriod(response.data);
      Alert.alert('Berhasil', 'Periode gaji telah disimpan', [
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
        Pilih periode gaji sesuai siklus pembayaran perusahaan Anda.
      </Text>

      {/* Preset Options (iOS Grouped List) */}
      <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
        {PAY_PERIOD_PRESETS.map((preset) => {
          const isSelected = selectedDay === preset.startDay;
          return (
            <Pressable
              key={preset.startDay}
              onPress={() => setSelectedDay(preset.startDay)}
              className={`flex-row items-center justify-between px-5 py-4 border-b border-dark-border active:bg-dark-border ${
                isSelected ? 'bg-primary-950/30' : ''
              }`}
            >
              <View>
                <Text className={`text-base ${isSelected ? 'text-primary-300 font-sans-bold shadow-sm' : 'text-white font-medium'}`}>
                  {preset.label}
                </Text>
                <Text className={`text-xs mt-1 ${isSelected ? 'text-primary-400/80 font-medium' : 'text-dark-muted'}`}>
                  Tanggal {preset.startDay} setiap bulan
                </Text>
              </View>
              {isSelected && (
                <SymbolView name="checkmark" size={20} tintColor="#3b82f6" weight="bold" />
              )}
            </Pressable>
          );
        })}

        {/* Custom Option */}
        <Pressable
          onPress={() => setSelectedDay('custom')}
          className={`flex-row items-center justify-between px-5 py-4 active:bg-dark-border ${
            selectedDay === 'custom' ? 'bg-primary-950/30' : ''
          }`}
        >
          <View>
            <Text className={`text-base ${selectedDay === 'custom' ? 'text-primary-300 font-sans-bold shadow-sm' : 'text-white font-medium'}`}>
              Kustom
            </Text>
            <Text className={`text-xs mt-1 ${selectedDay === 'custom' ? 'text-primary-400/80 font-medium' : 'text-dark-muted'}`}>
              Pilih tanggal mulai & selesai spesifik
            </Text>
          </View>
          {selectedDay === 'custom' && (
            <SymbolView name="checkmark" size={20} tintColor="#3b82f6" weight="bold" />
          )}
        </Pressable>
      </View>

      {/* Custom Date Pickers */}
      {selectedDay === 'custom' && (
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          <Pressable 
            className="flex-row items-center px-5 py-4 border-b border-dark-border active:bg-dark-border"
            onPress={() => setShowStartPicker(true)}
          >
            <SymbolView name="calendar.badge.plus" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-white text-base">Mulai Tanggal</Text>
              <Text className="text-primary-400 font-medium">{format(customStart, 'dd MMM yyyy', { locale: id })}</Text>
            </View>
          </Pressable>
          
          {showStartPicker && (
            <DateTimePicker
              value={customStart}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (event.type === 'set' && date) setCustomStart(date);
              }}
            />
          )}

          <Pressable 
            className="flex-row items-center px-5 py-4 active:bg-dark-border"
            onPress={() => setShowEndPicker(true)}
          >
            <SymbolView name="calendar.badge.minus" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-white text-base">Sampai Tanggal</Text>
              <Text className="text-primary-400 font-medium">{format(customEnd, 'dd MMM yyyy', { locale: id })}</Text>
            </View>
          </Pressable>

          {showEndPicker && (
            <DateTimePicker
              value={customEnd}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (event.type === 'set' && date) setCustomEnd(date);
              }}
            />
          )}
        </View>
      )}

      {/* Formula Selection */}
      <Text className="text-dark-muted text-sm mb-6 ml-1 font-medium mt-4">
        Pilih metode perhitungan upah lembur.
      </Text>
      
      <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
        <Pressable
          onPress={() => setFormulaType('indonesia')}
          className={`flex-row items-center justify-between px-5 py-4 border-b border-dark-border active:bg-dark-border ${
            formulaType === 'indonesia' ? 'bg-primary-950/30' : ''
          }`}
        >
          <View>
            <Text className={`text-base ${formulaType === 'indonesia' ? 'text-primary-300 font-sans-bold shadow-sm' : 'text-white font-medium'}`}>
              Formula Kemenaker
            </Text>
            <Text className={`text-xs mt-1 ${formulaType === 'indonesia' ? 'text-primary-400/80 font-medium' : 'text-dark-muted'}`}>
              Standar pemerintah Indonesia
            </Text>
          </View>
          {formulaType === 'indonesia' && (
            <SymbolView name="checkmark" size={20} tintColor="#3b82f6" weight="bold" />
          )}
        </Pressable>

        <Pressable
          onPress={() => setFormulaType('flat_rate')}
          className={`flex-row items-center justify-between px-5 py-4 active:bg-dark-border ${
            formulaType === 'flat_rate' ? 'bg-primary-950/30' : ''
          }`}
        >
          <View>
            <Text className={`text-base ${formulaType === 'flat_rate' ? 'text-primary-300 font-sans-bold shadow-sm' : 'text-white font-medium'}`}>
              Tarif Tetap (Flat Rate)
            </Text>
            <Text className={`text-xs mt-1 ${formulaType === 'flat_rate' ? 'text-primary-400/80 font-medium' : 'text-dark-muted'}`}>
              Tarif tetap per jam lembur
            </Text>
          </View>
          {formulaType === 'flat_rate' && (
            <SymbolView name="checkmark" size={20} tintColor="#3b82f6" weight="bold" />
          )}
        </Pressable>
      </View>

      {/* Flat Rate Amount Input */}
      {formulaType === 'flat_rate' && (
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6 flex-row items-center px-5 py-4">
          <SymbolView name="dollarsign.circle.fill" size={20} tintColor="#10b981" style={{ marginRight: 16 }} />
          <TextInput
            className="text-white text-base flex-1 p-0 m-0"
            placeholder="Nominal Rupiah Per Jam"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={flatRate}
            onChangeText={setFlatRate}
          />
        </View>
      )}

      <Pressable
        className={`bg-primary-600 rounded-2xl py-4 items-center mb-10 flex-row justify-center gap-2 active:opacity-70 ${
          isLoading ? 'opacity-50' : ''
        }`}
        onPress={onSave}
        disabled={isLoading}
      >
        {isLoading && <ActivityIndicator color="#fff" size="small" />}
        <Text className="text-white font-bold text-lg">Simpan Pengaturan</Text>
      </Pressable>
    </ScrollView>
  );
}
