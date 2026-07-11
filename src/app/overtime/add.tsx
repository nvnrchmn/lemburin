import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SymbolView } from 'expo-symbols';

import { useDataStore } from '@/stores/data-store';
import { supabase } from '@/lib/supabase';
import { calculateOvertimeMinutes, calculateOvertimePay, calculateTotalFixedAllowance } from '@/utils/calculator';
import { formatCurrency, formatDuration } from '@/utils/formatting';

import { useToastStore } from '@/stores/toast-store';

const overtimeSchema = z.object({
  workDate: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  breakMinutes: z.string().optional(),
  notes: z.string().optional(),
  isHoliday: z.boolean(),
});

type OvertimeFormValues = z.infer<typeof overtimeSchema>;

export default function AddOvertimeScreen() {
  const { activePayPeriod, employment, addOvertimeEntry } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToastStore();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Default times: 18:00 to 22:00
  const defaultStartTime = new Date();
  defaultStartTime.setHours(18, 0, 0, 0);
  
  const defaultEndTime = new Date();
  defaultEndTime.setHours(22, 0, 0, 0);

  let initialValues: OvertimeFormValues = {
    workDate: new Date(),
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    breakMinutes: '0',
    notes: '',
    isHoliday: false,
  };

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: initialValues
  });

  const watchAllFields = watch();

  // Live calculation of estimation
  const estimation = useMemo(() => {
    if (!activePayPeriod || !employment?.basic_salary) return { pay: 0, hoursStr: '0 jam' };

    const startStr = format(watchAllFields.startTime, 'HH:mm');
    const endStr = format(watchAllFields.endTime, 'HH:mm');
    const breakMins = parseInt(watchAllFields.breakMinutes || '0', 10);
    
    const totalMins = calculateOvertimeMinutes(startStr, endStr, isNaN(breakMins) ? 0 : breakMins);
    
    const payInfo = calculateOvertimePay(
      totalMins, 
      activePayPeriod.formula_type, 
      employment.basic_salary, 
      calculateTotalFixedAllowance(employment.allowances_detail || null),
      activePayPeriod.flat_rate_amount,
      watchAllFields.isHoliday
    );

    return {
      pay: payInfo.totalPay,
      hoursStr: formatDuration(totalMins)
    };
  }, [watchAllFields, activePayPeriod, employment]);

  const onSubmit = async (data: OvertimeFormValues) => {
    if (!activePayPeriod) {
      Alert.alert('Perhatian', 'Harap atur Periode Gaji terlebih dahulu di Pengaturan.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    setIsLoading(true);

    const startStr = format(data.startTime, 'HH:mm');
    const endStr = format(data.endTime, 'HH:mm');
    const breakMins = parseInt(data.breakMinutes || '0', 10);

    const payload = {
      pay_period_id: activePayPeriod.id,
      work_date: data.workDate.toISOString().split('T')[0],
      start_time: startStr,
      end_time: endStr,
      break_minutes: isNaN(breakMins) ? 0 : breakMins,
      notes: data.notes || null,
    };

    try {
      const { data: resultData, error } = await supabase
        .from('overtime_entries')
        // @ts-ignore
        .insert(payload)
        .select()
        .single();
        
      if (error) throw error;
      addOvertimeEntry(resultData);
      showToast('Catatan lembur telah disimpan', 'success');

      router.back();
    } catch (error: any) {
      showToast(error.message || 'Gagal Menyimpan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg px-5 pt-6" showsVerticalScrollIndicator={false}>
      {!activePayPeriod && (
        <View className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 mb-6 flex-row items-center">
          <SymbolView name="exclamationmark.triangle.fill" size={24} tintColor="#f87171" style={{ marginRight: 12 }} />
          <Text className="text-red-400 text-sm flex-1">
            Periode gaji belum diatur. Estimasi upah tidak dapat dihitung. Silakan atur di menu Pengaturan.
          </Text>
        </View>
      )}

      {/* GROUP 1: Waktu Lembur */}
      <View className="w-full">
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Waktu Pelaksanaan</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Date Field */}
          <Controller
            control={control}
            name="workDate"
            render={({ field: { value } }) => (
              <>
                <Pressable 
                  className="flex-row items-center px-5 py-4 border-b border-dark-border active:bg-dark-border"
                  onPress={() => setShowDatePicker(true)}
                >
                  <SymbolView name="calendar" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
                  <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-white text-base">Tanggal</Text>
                    <Text className="text-primary-400 font-medium">{format(value, 'EEE, dd MMM yyyy', { locale: id })}</Text>
                  </View>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setValue('workDate', selectedDate);
                    }}
                  />
                )}
              </>
            )}
          />

          {/* Start Time Field */}
          <Controller
            control={control}
            name="startTime"
            render={({ field: { value } }) => (
              <>
                <Pressable 
                  className="flex-row items-center px-5 py-4 border-b border-dark-border active:bg-dark-border"
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <SymbolView name="clock.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
                  <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-white text-base">Jam Mulai</Text>
                    <Text className="text-primary-400 font-medium">{format(value, 'HH:mm')}</Text>
                  </View>
                </Pressable>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={value}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartTimePicker(false);
                      if (selectedDate) setValue('startTime', selectedDate);
                    }}
                  />
                )}
              </>
            )}
          />

          {/* End Time Field */}
          <Controller
            control={control}
            name="endTime"
            render={({ field: { value } }) => (
              <>
                <Pressable 
                  className="flex-row items-center px-5 py-4 active:bg-dark-border"
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <SymbolView name="clock.badge.checkmark" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
                  <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-white text-base">Jam Selesai</Text>
                    <Text className="text-primary-400 font-medium">{format(value, 'HH:mm')}</Text>
                  </View>
                </Pressable>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={value}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEndTimePicker(false);
                      if (selectedDate) setValue('endTime', selectedDate);
                    }}
                  />
                )}
              </>
            )}
          />
        </View>

        {/* GROUP 2: Pengaturan Tambahan */}
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Pengaturan Tambahan</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Break Minutes */}
          <View className="flex-row items-center px-5 py-4 border-b border-dark-border">
            <SymbolView name="cup.and.saucer.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-white text-base">Istirahat (menit)</Text>
              <Controller
                control={control}
                name="breakMinutes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-primary-400 font-medium text-base text-right p-0 m-0 w-20"
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Holiday Toggle */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center">
              <SymbolView name="sparkles" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
              <View>
                <Text className="text-white text-base">Hari Libur / Merah</Text>
              </View>
            </View>
            <Controller
              control={control}
              name="isHoliday"
              render={({ field: { onChange, value } }) => (
                <Switch
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor={'#ffffff'}
                  onValueChange={onChange}
                  value={value}
                />
              )}
            />
          </View>
        </View>

        {/* GROUP 3: Catatan */}
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Informasi Tambahan</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          <View className="flex-row px-5 py-4 min-h-[100px]">
            <SymbolView name="note.text" size={20} tintColor="#64748b" style={{ marginRight: 16, marginTop: 2 }} />
            <View className="flex-1">
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0 w-full"
                    style={{ minHeight: 80, maxHeight: 120 }}
                    placeholder="Tambahkan catatan lembur..."
                    placeholderTextColor="#64748b"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    textAlignVertical="top"
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Estimation Preview */}
        <View className="bg-primary-900/30 border border-primary-900/50 rounded-3xl p-5 mb-8 items-center">
          <Text className="text-primary-400 text-xs font-bold tracking-widest mb-2">ESTIMASI UPAH (LIVE)</Text>
          <Text className="text-white text-4xl font-bold mb-1">{formatCurrency(estimation.pay)}</Text>
          <Text className="text-primary-200/70 text-sm font-medium">
            {estimation.hoursStr} × {activePayPeriod?.formula_type === 'indonesia' ? 'Formula Kemenaker' : 'Tarif Flat'}
            {watchAllFields.isHoliday ? ' (Libur Nasional)' : ''}
          </Text>
        </View>

        <Pressable
          className={`bg-primary-600 rounded-2xl py-4 items-center mb-10 flex-row justify-center gap-2 active:opacity-70 ${
            isLoading ? 'opacity-50' : ''
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading && <ActivityIndicator color="#fff" size="small" />}
          <Text className="text-white font-bold text-lg">Simpan Lembur</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
