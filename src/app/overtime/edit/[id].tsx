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
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { useDataStore } from '@/stores/data-store';
import { supabase } from '@/lib/supabase';
import {
  calculateOvertimeMinutes,
  calculateOvertimePay,
  calculateTotalFixedAllowance,
} from '@/utils/calculator';
import { formatCurrency, formatDuration } from '@/utils/formatting';
import { pickAndUploadImage } from '@/utils/upload';
import { useToastStore } from '@/stores/toast-store';
import { getOrCreatePayPeriodForDate } from '@/services/pay-period-service';
import { syncService } from '@/services/sync-service';
import { checkIsHoliday } from '@/utils/holidays';

const overtimeSchema = z.object({
  workDate: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  breakMinutes: z.string().optional(),
  notes: z.string().optional(),
  isHoliday: z.boolean(),
});

type OvertimeFormValues = z.infer<typeof overtimeSchema>;

export default function EditOvertimeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activePayPeriod, employment, updateOvertimeEntry, overtimeEntries } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToastStore();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const editingEntry = useMemo(() => {
    if (id && overtimeEntries) {
      return overtimeEntries.find(e => e.id === id);
    }
    return null;
  }, [id, overtimeEntries]);

  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(
    editingEntry?.attachment_url || null,
  );

  // Initial values setup
  let initialValues: OvertimeFormValues = {
    workDate: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    breakMinutes: '0',
    notes: '',
    isHoliday: false,
  };

  if (editingEntry) {
    const sDate = new Date(editingEntry.work_date);
    const [sH, sM] = editingEntry.start_time.split(':');
    const startT = new Date(sDate);
    startT.setHours(parseInt(sH, 10), parseInt(sM, 10), 0, 0);

    const [eH, eM] = editingEntry.end_time.split(':');
    const endT = new Date(sDate);
    endT.setHours(parseInt(eH, 10), parseInt(eM, 10), 0, 0);

    initialValues = {
      workDate: sDate,
      startTime: startT,
      endTime: endT,
      breakMinutes: String(editingEntry.break_minutes),
      notes: editingEntry.notes || '',
      isHoliday: editingEntry.is_holiday ?? false,
    };
  }

  const { control, handleSubmit, watch, setValue } = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: initialValues,
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
    if (!employment?.id || !id) {
      Alert.alert('Perhatian', 'Harap atur Profil Perusahaan terlebih dahulu di Pengaturan.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    setIsLoading(true);

    const startStr = format(data.startTime, 'HH:mm');
    const endStr = format(data.endTime, 'HH:mm');
    const breakMins = parseInt(data.breakMinutes || '0', 10);
    const workDateStr = data.workDate.toISOString().split('T')[0];

    try {
      // Cari atau buatkan otomatis periode yang tepat jika tanggal kerja berubah bulan/siklus
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
        .update(payload as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (activePayPeriod?.id === targetPeriod.id) {
        updateOvertimeEntry(resultData as any);
      } else {
        // Jika dipindah ke periode lain, refresh data
        await syncService();
      }

      showToast('Perubahan berhasil disimpan', 'success');
      router.back();
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  if (!editingEntry) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center">
        <Text className="text-white">Data tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-bg px-5 pt-6" showsVerticalScrollIndicator={false}>
      {!activePayPeriod && (
        <View className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 mb-6 flex-row items-center">
          <Ionicons name="warning" size={24} color="#f87171" />
          <Text className="text-red-400 text-sm flex-1">
            Periode gaji belum diatur. Estimasi upah tidak dapat dihitung. Silakan atur di menu
            Pengaturan.
          </Text>
        </View>
      )}

      {/* GROUP 1: Waktu Lembur */}
      <View className="w-full">
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Waktu Pelaksanaan
        </Text>
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
                  <Ionicons name="calendar" size={20} color="#64748b" />
                  <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-white text-base">Tanggal</Text>
                    <Text className="text-primary-400 font-medium">
                      {format(value, 'EEE, dd MMM yyyy', { locale: localeId })}
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
                      if (selectedDate) {
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
                  <Ionicons name="time" size={20} color="#64748b" />
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
                  <Ionicons name="time" size={20} color="#64748b" />
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
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Pengaturan Tambahan
        </Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Break Minutes */}
          <View className="flex-row items-center px-5 py-4 border-b border-dark-border">
            <Ionicons name="cafe" size={20} color="#64748b" />
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
            <View className="flex-row items-center flex-1 mr-3">
              <Ionicons name="sparkles" size={20} color="#64748b" />
              <View className="flex-1">
                <Text className="text-white text-base">Hari Libur / Merah</Text>
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
                    <Text className="text-dark-muted text-xs mt-0.5">
                      Tarif libur PP 35/2021 (2x-4x)
                    </Text>
                  );
                })()}
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
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Informasi Tambahan
        </Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          <View className="flex-row px-5 py-4 min-h-[100px]">
            <Ionicons name="document-text" size={20} color="#64748b" />
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

        {/* GROUP 4: Bukti SPL / Absensi */}
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Bukti SPL / Absensi (Opsional)
        </Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden p-4 mb-6">
          {attachmentUrl ? (
            <View className="relative">
              <Image
                source={{ uri: attachmentUrl }}
                className="w-full h-44 rounded-2xl bg-dark-bg"
                resizeMode="cover"
              />
              <View className="flex-row gap-2 absolute top-2 right-2">
                <Pressable
                  className="bg-primary-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1 shadow-lg"
                  onPress={handlePickAttachment}
                >
                  <Ionicons name="refresh" size={14} color="#fff" />
                  <Text className="text-white text-xs font-bold">Ganti</Text>
                </Pressable>
                <Pressable
                  className="bg-red-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1 shadow-lg"
                  onPress={() => setAttachmentUrl(null)}
                >
                  <Ionicons name="trash" size={14} color="#fff" />
                  <Text className="text-white text-xs font-bold">Hapus</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              className="border border-dashed border-dark-border rounded-2xl py-6 items-center justify-center active:bg-dark-border/40"
              onPress={handlePickAttachment}
            >
              <View className="w-12 h-12 bg-primary-950/40 rounded-full items-center justify-center mb-2 border border-primary-500/30">
                <Ionicons name="camera" size={22} color="#60a5fa" />
              </View>
              <Text className="text-white font-bold text-sm">Lampirkan Foto Bukti SPL</Text>
              <Text className="text-dark-muted text-xs mt-0.5">
                Ambil foto atau pilih dari galeri
              </Text>
            </Pressable>
          )}
        </View>

        {/* Estimation Preview */}
        <View className="bg-primary-900/30 border border-primary-900/50 rounded-3xl p-5 mb-8 items-center">
          <Text className="text-primary-400 text-xs font-bold tracking-widest mb-2">
            ESTIMASI UPAH (LIVE)
          </Text>
          <Text className="text-white text-4xl font-bold mb-1">
            {formatCurrency(estimation.pay)}
          </Text>
          <Text className="text-primary-200/70 text-sm font-medium">
            {estimation.hoursStr} ×{' '}
            {activePayPeriod?.formula_type === 'indonesia' ? 'Formula Kemenaker' : 'Tarif Flat'}
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
          <Text className="text-white font-bold text-lg">Simpan Perubahan</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
