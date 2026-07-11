import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { useDataStore } from '@/stores/data-store';
import { supabase } from '@/lib/supabase';
import { calculateOvertimeMinutes, calculateOvertimePay, calculateTotalFixedAllowance } from '@/utils/calculator';
import { formatCurrency, formatDuration } from '@/utils/formatting';

const overtimeSchema = z.object({
  workDate: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  breakMinutes: z.string().optional(),
  notes: z.string().optional(),
  isHoliday: z.boolean(),
});

type OvertimeFormValues = z.infer<typeof overtimeSchema>;

export default function AddOvertimeTabScreen() {
  const { activePayPeriod, employment, addOvertimeEntry } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Default times: 18:00 to 22:00
  const defaultStartTime = new Date();
  defaultStartTime.setHours(18, 0, 0, 0);
  
  const defaultEndTime = new Date();
  defaultEndTime.setHours(22, 0, 0, 0);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: {
      workDate: new Date(),
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      breakMinutes: '0',
      notes: '',
      isHoliday: false,
    }
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
        { text: 'OK', onPress: () => router.push('/(tabs)/settings') }
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
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;

      addOvertimeEntry(resultData);
      Alert.alert('Berhasil', 'Catatan lembur telah disimpan', [
        { text: 'OK', onPress: () => {
          // Reset slightly but keep date if they want to add another for same day
          setValue('startTime', defaultStartTime);
          setValue('endTime', defaultEndTime);
          setValue('breakMinutes', '0');
          setValue('notes', '');
          
          router.push('/(tabs)');
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg px-5 pt-6">
      <Text className="text-dark-text text-2xl font-bold mb-2">
        Tambah Lembur
      </Text>
      <Text className="text-dark-muted text-sm mb-6">
        Catat aktivitas lembur hari ini
      </Text>

      {!activePayPeriod && (
        <View className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-4">
          <Text className="text-red-400 text-sm">
            Periode gaji belum diatur. Estimasi upah tidak dapat dihitung. Silakan atur di menu Pengaturan terlebih dahulu.
          </Text>
        </View>
      )}
      
      {!employment?.basic_salary && activePayPeriod?.formula_type === 'indonesia' && (
        <View className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-4 mb-4">
          <Text className="text-yellow-400 text-sm">
            Gaji pokok belum diatur pada Profil Perusahaan. Perhitungan formula Indonesia akan bernilai 0.
          </Text>
        </View>
      )}

      {/* Form */}
      <View className="space-y-3">
        {/* Date Field */}
        <View>
          <Controller
            control={control}
            name="workDate"
            render={({ field: { value } }) => (
              <>
                <Pressable 
                  className="bg-dark-card border border-dark-border rounded-xl px-4 py-3.5 flex-row items-center"
                  onPress={() => setShowDatePicker(true)}
                >
                  <View className="flex-1">
                    <Text className="text-dark-muted text-xs mb-0.5">Tanggal</Text>
                    <Text className="text-dark-text text-base">{format(value, 'EEEE, dd MMM yyyy', { locale: id })}</Text>
                  </View>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (event.type === 'set' && selectedDate) setValue('workDate', selectedDate);
                    }}
                  />
                )}
              </>
            )}
          />
        </View>

        {/* Start/End Time Fields */}
        <View className="flex-row gap-3 mt-3">
          {/* Start Time */}
          <View className="flex-1">
            <Controller
              control={control}
              name="startTime"
              render={({ field: { value } }) => (
                <>
                  <Pressable 
                    className="bg-dark-card border border-dark-border rounded-xl px-4 py-3.5"
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text className="text-dark-muted text-xs mb-0.5">Jam Mulai</Text>
                    <Text className="text-dark-text text-base font-bold">{format(value, 'HH:mm')}</Text>
                  </Pressable>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={value}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartTimePicker(false);
                        if (event.type === 'set' && selectedDate) setValue('startTime', selectedDate);
                      }}
                    />
                  )}
                </>
              )}
            />
          </View>
          
          {/* End Time */}
          <View className="flex-1">
            <Controller
              control={control}
              name="endTime"
              render={({ field: { value } }) => (
                <>
                  <Pressable 
                    className="bg-dark-card border border-dark-border rounded-xl px-4 py-3.5"
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text className="text-dark-muted text-xs mb-0.5">Jam Selesai</Text>
                    <Text className="text-dark-text text-base font-bold">{format(value, 'HH:mm')}</Text>
                  </Pressable>
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={value}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowEndTimePicker(false);
                        if (event.type === 'set' && selectedDate) setValue('endTime', selectedDate);
                      }}
                    />
                  )}
                </>
              )}
            />
          </View>
        </View>

        {/* Break Minutes */}
        <View className="mt-3">
          <View className="bg-dark-card border border-dark-border rounded-xl px-4 py-1 flex-row items-center">
            <View className="flex-1 py-1.5">
              <Text className="text-dark-muted text-xs mb-0.5">Istirahat (menit)</Text>
              <Controller
                control={control}
                name="breakMinutes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-dark-text text-base p-0 m-0"
                    placeholder="0"
                    placeholderTextColor="#60646C"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Holiday Toggle */}
        <View className="mt-3 bg-dark-card border border-dark-border rounded-xl px-4 py-3.5 flex-row items-center justify-between">
          <View>
            <Text className="text-dark-text text-base">Hari Libur / Tanggal Merah</Text>
            <Text className="text-dark-muted text-xs">Perhitungan formula otomatis menyesuaikan</Text>
          </View>
          <Controller
            control={control}
            name="isHoliday"
            render={({ field: { onChange, value } }) => (
              <Switch
                trackColor={{ false: '#2E3135', true: '#3b82f6' }}
                thumbColor={'#ffffff'}
                onValueChange={onChange}
                value={value}
              />
            )}
          />
        </View>

        {/* Notes */}
        <View className="mt-3">
          <View className="bg-dark-card border border-dark-border rounded-xl px-4 py-1 flex-row items-center">
            <View className="flex-1 py-1.5">
              <Text className="text-dark-muted text-xs mb-0.5">Catatan (opsional)</Text>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-dark-text text-base p-0 m-0"
                    placeholder="Tambahkan catatan..."
                    placeholderTextColor="#60646C"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                  />
                )}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Estimation Preview */}
      <View className="bg-primary-950 border border-primary-800 rounded-xl p-4 mt-6">
        <Text className="text-primary-300 text-xs mb-1">ESTIMASI UPAH (Live)</Text>
        <Text className="text-dark-text text-2xl font-bold">{formatCurrency(estimation.pay)}</Text>
        <Text className="text-dark-muted text-xs mt-1">
          {estimation.hoursStr} × Formula {activePayPeriod?.formula_type === 'indonesia' ? 'Indonesia' : 'Flat'} 
          {watchAllFields.isHoliday ? ' (Libur)' : ''}
        </Text>
      </View>

      <Pressable
        className={`bg-primary-600 rounded-xl py-4 items-center mt-6 mb-10 flex-row justify-center gap-2 ${
          isLoading ? 'opacity-70' : 'active:bg-primary-700'
        }`}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
      >
        {isLoading && <ActivityIndicator color="#fff" size="small" />}
        <Text className="text-white font-semibold text-base">Simpan Lembur</Text>
      </Pressable>
    </ScrollView>
  );
}
