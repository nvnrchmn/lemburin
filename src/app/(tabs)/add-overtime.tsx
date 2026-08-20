import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { useDataStore } from '@/stores/data-store';
import { useToastStore } from '@/stores/toast-store';
import { supabase } from '@/lib/supabase';
import {
  calculateOvertimeMinutes,
  calculateOvertimePay,
  calculateTotalFixedAllowance,
} from '@/utils/calculator';
import { formatCurrency, formatDuration } from '@/utils/formatting';
import { pickAndUploadImage } from '@/utils/upload';
import { getOrCreatePayPeriodForDate } from '@/services/pay-period-service';
import { checkIsHoliday } from '@/utils/holidays';

const overtimeSchema = z
  .object({
    workDate: z.date(),
    startTime: z.date(),
    endTime: z.date(),
    breakMinutes: z.string().optional(),
    notes: z.string().optional(),
    isHoliday: z.boolean(),
  })
  .refine(
    data => {
      // Error prevention: jam selesai harus setelah jam mulai (dalam hari yang sama).
      // Lembur lintas tengah malam tetap valid (ditangani di calculateOvertimeMinutes).
      const startMin = data.startTime.getHours() * 60 + data.startTime.getMinutes();
      const endMin = data.endTime.getHours() * 60 + data.endTime.getMinutes();
      return endMin > startMin;
    },
    {
      message: 'Jam selesai harus lebih lambat dari jam mulai',
      path: ['endTime'],
    },
  );

type OvertimeFormValues = z.infer<typeof overtimeSchema>;

export default function AddOvertimeTabScreen() {
  const { activePayPeriod, employment, addOvertimeEntry } = useDataStore();
  const { showToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Default times: 18:00 to 22:00
  const defaultStartTime = new Date();
  defaultStartTime.setHours(18, 0, 0, 0);

  const defaultEndTime = new Date();
  defaultEndTime.setHours(22, 0, 0, 0);

  const { control, handleSubmit, watch, setValue } = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: {
      workDate: new Date(),
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      breakMinutes: '0',
      notes: '',
      isHoliday: false,
    },
  });

  const watchAllFields = watch();

  const handlePickAttachment = () => {
    Alert.alert('Lampirkan Foto Bukti SPL / Absensi', 'Pilih sumber foto:', [
      {
        text: 'Kamera',
        onPress: async () => {
          const url = await pickAndUploadImage(true, 'overtime');
          if (url) setAttachmentUrl(url);
        },
      },
      {
        text: 'Galeri Foto',
        onPress: async () => {
          const url = await pickAndUploadImage(false, 'overtime');
          if (url) setAttachmentUrl(url);
        },
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

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
      watchAllFields.isHoliday,
      employment.work_system || '5_days',
      employment.overtime_meal_allowance || 0,
      employment.overtime_transport_allowance || 0,
    );

    return {
      pay: payInfo.totalPay,
      hoursStr: formatDuration(totalMins),
    };
  }, [watchAllFields, activePayPeriod, employment]);

  const onSubmit = async (data: OvertimeFormValues) => {
    if (!employment?.id) {
      Alert.alert('Perhatian', 'Harap atur Profil Perusahaan terlebih dahulu di Pengaturan.', [
        { text: 'OK', onPress: () => router.push('/company/setup') },
      ]);
      return;
    }

    setIsLoading(true);

    const startStr = format(data.startTime, 'HH:mm');
    const endStr = format(data.endTime, 'HH:mm');
    const breakMins = parseInt(data.breakMinutes || '0', 10);
    const workDateStr = data.workDate.toISOString().split('T')[0];

    try {
      // Cari atau buatkan otomatis periode yang tepat untuk tanggal lembur ini
      const targetPeriod = await getOrCreatePayPeriodForDate(
        employment.id,
        workDateStr,
        activePayPeriod,
      );

      const payload = {
        pay_period_id: targetPeriod.id,
        work_date: workDateStr,
        start_time: startStr,
        end_time: endStr,
        break_minutes: isNaN(breakMins) ? 0 : breakMins,
        is_holiday: data.isHoliday,
        attachment_url: attachmentUrl,
        notes: data.notes || null,
      };

      const { data: resultData, error } = await supabase
        .from('overtime_entries')
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;

      // Jika tanggal lembur masuk ke periode yang sedang aktif ditampilkan di dashboard, update state lokal
      if (activePayPeriod?.id === targetPeriod.id) {
        addOvertimeEntry(resultData);
      }

      // Feedback sukses via toast (bukan Alert) agar lebih halus & tidak memblokir
      showToast(`Catatan lembur tersimpan di Periode ${targetPeriod.period_name}`, 'success');
      // Reset slightly but keep date if they want to add another for same day
      setValue('startTime', defaultStartTime);
      setValue('endTime', defaultEndTime);
      setValue('breakMinutes', '0');
      setValue('notes', '');
      setAttachmentUrl(null);

      router.push('/(tabs)');
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg px-5 pt-6">
      <Text className="text-dark-text text-2xl font-bold mb-2">Tambah Lembur</Text>
      <Text className="text-dark-muted text-sm mb-6">Catat aktivitas lembur hari ini</Text>

      {!activePayPeriod && (
        <View className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-4">
          <Text className="text-red-400 text-sm">
            Periode gaji belum diatur. Estimasi upah tidak dapat dihitung. Silakan atur di menu
            Pengaturan terlebih dahulu.
          </Text>
        </View>
      )}

      {!employment?.basic_salary && activePayPeriod?.formula_type === 'indonesia' && (
        <View className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-4 mb-4">
          <Text className="text-yellow-400 text-sm">
            Gaji pokok belum diatur pada Profil Perusahaan. Perhitungan formula Indonesia akan
            bernilai 0.
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
                    <Text className="text-dark-text text-base">
                      {format(value, 'EEEE, dd MMM yyyy', { locale: id })}
                    </Text>
                  </View>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (event.type === 'set' && selectedDate) {
                        setValue('workDate', selectedDate);
                        const holCheck = checkIsHoliday(
                          selectedDate,
                          employment?.work_system || '5_days',
                        );
                        setValue('isHoliday', holCheck.isHoliday);
                      }
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
                    <Text className="text-dark-text text-base font-bold">
                      {format(value, 'HH:mm')}
                    </Text>
                  </Pressable>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={value}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartTimePicker(false);
                        if (event.type === 'set' && selectedDate)
                          setValue('startTime', selectedDate);
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
              render={({ field: { value }, fieldState: { error } }) => (
                <>
                  <Pressable
                    className={`bg-dark-card border rounded-xl px-4 py-3.5 ${
                      error ? 'border-red-500' : 'border-dark-border'
                    }`}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text className="text-dark-muted text-xs mb-0.5">Jam Selesai</Text>
                    <Text className="text-dark-text text-base font-bold">
                      {format(value, 'HH:mm')}
                    </Text>
                  </Pressable>
                  {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error.message}</Text>}
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
          <View className="flex-1 mr-3">
            <Text className="text-dark-text text-base">Hari Libur / Tanggal Merah</Text>
            {(() => {
              const hol = checkIsHoliday(
                watchAllFields.workDate,
                employment?.work_system || '5_days',
              );
              if (hol.holidayName) {
                return (
                  <Text className="text-amber-400 text-xs mt-0.5 font-medium">
                    ✦ {hol.holidayName}
                  </Text>
                );
              }
              return (
                <Text className="text-dark-muted text-xs">
                  Perhitungan formula otomatis menyesuaikan
                </Text>
              );
            })()}
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

        {/* Bukti SPL / Absensi */}
        <View className="mt-3">
          <Text className="text-dark-muted text-xs mb-1.5 ml-1">
            Foto Bukti SPL / Absensi (opsional)
          </Text>
          <View className="bg-dark-card border border-dark-border rounded-2xl p-3">
            {attachmentUrl ? (
              <View className="relative">
                <Image
                  source={{ uri: attachmentUrl }}
                  className="w-full h-40 rounded-xl bg-dark-bg"
                  resizeMode="cover"
                />
                <Pressable
                  className="absolute top-2 right-2 bg-red-600 px-3 py-1 rounded-lg flex-row items-center gap-1"
                  onPress={() => setAttachmentUrl(null)}
                >
                  <Ionicons name="trash" size={12} color="#fff" />
                  <Text className="text-white text-xs font-bold">Hapus</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                className="border border-dashed border-dark-border rounded-xl py-5 items-center justify-center active:bg-dark-border/30"
                onPress={handlePickAttachment}
              >
                <Ionicons name="camera" size={20} color="#60a5fa" style={{ marginBottom: 4 }} />
                <Text className="text-white font-medium text-xs">Lampirkan Foto Bukti SPL</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Estimation Preview */}
      <View className="bg-primary-950 border border-primary-800 rounded-xl p-4 mt-6">
        <Text className="text-primary-300 text-xs mb-1">ESTIMASI UPAH (Live)</Text>
        <Text className="text-dark-text text-2xl font-bold">{formatCurrency(estimation.pay)}</Text>
        <Text className="text-dark-muted text-xs mt-1">
          {estimation.hoursStr} × Formula{' '}
          {activePayPeriod?.formula_type === 'indonesia' ? 'Indonesia' : 'Flat'}
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
