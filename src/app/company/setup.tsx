import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useDataStore } from '@/stores/data-store';
import { formatNumberInput, parseNumberInput } from '@/utils/formatting';

const componentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Nama wajib diisi' }),
  amount: z.string().min(1, { message: 'Nominal wajib diisi' }),
  is_fixed: z.boolean().optional(),
});

type SalaryComponent = { id: string; name: string; amount: number; is_fixed: boolean };

const companySchema = z.object({
  companyName: z.string().min(2, { message: 'Nama perusahaan wajib diisi' }),
  jobTitle: z.string().optional(),
  employeeCode: z.string().optional(),
  workSystem: z.enum(['5_days', '6_days']),
  basicSalary: z.string().min(1, { message: 'Gaji pokok wajib diisi' }),
  overtimeMealAllowance: z.string().optional(),
  overtimeTransportAllowance: z.string().optional(),
  ptkpStatus: z.enum(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']),
  hasBpjsTk: z.boolean(),
  hasBpjsKes: z.boolean(),
  allowancesDetail: z.array(componentSchema).optional(),
  deductionsDetail: z.array(componentSchema).optional(),
  startDate: z.date(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanySetupScreen() {
  const { user } = useAuthStore();
  const { employment, setEmployment } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: employment?.company_name || '',
      jobTitle: employment?.job_title || '',
      employeeCode: employment?.employee_code || '',
      workSystem: (employment?.work_system as '5_days' | '6_days') || '5_days',
      basicSalary: employment?.basic_salary ? formatNumberInput(employment.basic_salary) : '',
      overtimeMealAllowance: employment?.overtime_meal_allowance
        ? formatNumberInput(employment.overtime_meal_allowance)
        : '',
      overtimeTransportAllowance: employment?.overtime_transport_allowance
        ? formatNumberInput(employment.overtime_transport_allowance)
        : '',
      ptkpStatus: (employment?.ptkp_status as any) || 'TK/0',
      hasBpjsTk: employment?.has_bpjs_tk ?? true,
      hasBpjsKes: employment?.has_bpjs_kes ?? true,
      allowancesDetail:
        employment?.allowances_detail?.map(a => ({ ...a, amount: formatNumberInput(a.amount) })) ||
        [],
      deductionsDetail:
        employment?.deductions_detail?.map(d => ({ ...d, amount: formatNumberInput(d.amount) })) ||
        [],
      startDate: employment?.start_date ? new Date(employment.start_date) : new Date(),
    },
  });

  const {
    fields: allowanceFields,
    append: appendAllowance,
    remove: removeAllowance,
  } = useFieldArray({
    control,
    name: 'allowancesDetail',
  });

  const {
    fields: deductionFields,
    append: appendDeduction,
    remove: removeDeduction,
  } = useFieldArray({
    control,
    name: 'deductionsDetail',
  });

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user) {
      Alert.alert('Error', 'Sesi login tidak valid.');
      return;
    }

    setIsLoading(true);

    const salaryNumber = parseNumberInput(data.basicSalary);
    const mealNumber = data.overtimeMealAllowance
      ? parseNumberInput(data.overtimeMealAllowance)
      : null;
    const transportNumber = data.overtimeTransportAllowance
      ? parseNumberInput(data.overtimeTransportAllowance)
      : null;

    const mapComponents = (
      list: { id?: string; name: string; amount: string; is_fixed?: boolean }[],
    ): SalaryComponent[] =>
      list.map(c => ({
        id: c.id || Math.random().toString(36).substring(2, 9),
        name: c.name,
        amount: parseNumberInput(c.amount),
        is_fixed: c.is_fixed || false,
      }));

    const parsedAllowances = mapComponents(data.allowancesDetail || []);
    const parsedDeductions = mapComponents(data.deductionsDetail || []);

    const payload = {
      user_id: user.id,
      company_name: data.companyName,
      job_title: data.jobTitle || null,
      employee_code: data.employeeCode || null,
      work_system: data.workSystem,
      basic_salary: salaryNumber,
      overtime_meal_allowance: mealNumber,
      overtime_transport_allowance: transportNumber,
      ptkp_status: data.ptkpStatus,
      has_bpjs_tk: data.hasBpjsTk,
      has_bpjs_kes: data.hasBpjsKes,
      allowance: parsedAllowances.reduce((sum, a) => sum + a.amount, 0), // legacy fallback
      allowances_detail: parsedAllowances,
      deductions_detail: parsedDeductions,
      start_date: data.startDate.toISOString().split('T')[0], // YYYY-MM-DD
      is_active: true,
    };

    try {
      let response;
      if (employment?.id) {
        // Update existing
        response = await supabase
          .from('employments')
          // @ts-ignore
          .update(payload as any)
          .eq('id', employment.id)
          .select()
          .single();
      } else {
        // Insert new
        response = await supabase
          .from('employments')
          // @ts-ignore
          .insert(payload as any)
          .select()
          .single();
      }

      if (response.error) throw response.error;

      setEmployment(response.data);
      Alert.alert('Berhasil', 'Informasi perusahaan telah disimpan', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-light-bg dark:bg-dark-bg px-5 pt-6"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-light-muted dark:text-dark-muted text-sm mb-6 ml-1 font-medium">
        Informasi pekerjaan Anda, termasuk Gaji Pokok untuk keperluan perhitungan lembur.
      </Text>

      <View className="w-full">
        {/* GROUP 1: Informasi Pekerjaan */}
        <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Informasi Pekerjaan
        </Text>
        <View className="bg-light-card dark:bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Company Name */}
          <View
            className={`flex-row items-center px-5 py-4 border-b ${errors.companyName ? 'border-red-500/50' : 'border-light-border dark:border-dark-border'}`}
          >
            <Ionicons name="business" size={20} color="#64748b" />
            <View className="flex-1">
              <Controller
                control={control}
                name="companyName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="Nama Perusahaan *"
                    placeholderTextColor="#64748b"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Job Title */}
          <View className="flex-row items-center px-5 py-4 border-b border-light-border dark:border-dark-border">
            <Ionicons name="briefcase" size={20} color="#64748b" />
            <View className="flex-1">
              <Controller
                control={control}
                name="jobTitle"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="Jabatan (Opsional)"
                    placeholderTextColor="#64748b"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Employee Code */}
          <View className="flex-row items-center px-5 py-4 border-b border-light-border dark:border-dark-border">
            <Ionicons name="grid" size={20} color="#64748b" />
            <View className="flex-1">
              <Controller
                control={control}
                name="employeeCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="ID Karyawan (Opsional)"
                    placeholderTextColor="#64748b"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Start Date */}
          <Controller
            control={control}
            name="startDate"
            render={({ field: { value } }) => (
              <>
                <Pressable
                  className="flex-row items-center px-5 py-4 active:bg-light-border dark:active:bg-dark-border"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#64748b" />
                  <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-white text-base">Mulai Bekerja</Text>
                    <Text className="text-primary-400 font-medium">
                      {format(value, 'dd MMM yyyy', { locale: id })}
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
                        setValue('startDate', selectedDate);
                      }
                    }}
                  />
                )}
              </>
            )}
          />
        </View>

        {/* GROUP: Sistem Hari Kerja (PP 35/2021) */}
        <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4 mt-2">
          Sistem Hari Kerja (PP 35/2021)
        </Text>
        <View className="bg-light-card dark:bg-dark-card rounded-3xl overflow-hidden mb-6">
          <Controller
            control={control}
            name="workSystem"
            render={({ field: { value, onChange } }) => (
              <>
                <Pressable
                  className={`flex-row items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border active:bg-light-border dark:active:bg-dark-border ${value === '5_days' ? 'bg-primary-950/30' : ''}`}
                  onPress={() => onChange('5_days')}
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className={`text-base font-bold ${value === '5_days' ? 'text-primary-300' : 'text-white'}`}
                    >
                      5 Hari Kerja (Kantor)
                    </Text>
                    <Text className="text-light-muted dark:text-dark-muted text-xs mt-0.5">
                      8 jam/hari (40 jam/minggu). Tarif libur 2x untuk 8 jam pertama.
                    </Text>
                  </View>
                  {value === '5_days' && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
                </Pressable>

                <Pressable
                  className={`flex-row items-center justify-between px-5 py-4 active:bg-light-border dark:active:bg-dark-border ${value === '6_days' ? 'bg-primary-950/30' : ''}`}
                  onPress={() => onChange('6_days')}
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className={`text-base font-bold ${value === '6_days' ? 'text-primary-300' : 'text-white'}`}
                    >
                      6 Hari Kerja (Pabrik / Shift)
                    </Text>
                    <Text className="text-light-muted dark:text-dark-muted text-xs mt-0.5">
                      7 jam/hari (40 jam/minggu). Tarif libur 2x untuk 7 jam pertama.
                    </Text>
                  </View>
                  {value === '6_days' && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
                </Pressable>
              </>
            )}
          />
        </View>

        {/* GROUP 2: Komponen Gaji */}
        <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4 mt-2">
          Komponen Upah
        </Text>
        <View className="bg-light-card dark:bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Basic Salary */}
          <View
            className={`flex-row items-center px-5 py-4 border-b border-light-border dark:border-dark-border ${errors.basicSalary ? 'border-b-red-500/50' : ''}`}
          >
            <Ionicons name="cash" size={20} color="#64748b" />
            <View className="flex-1">
              <Controller
                control={control}
                name="basicSalary"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="Gaji Pokok Per Bulan *"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={text => onChange(formatNumberInput(text))}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Overtime Meal Allowance */}
          <View className="flex-row items-center px-5 py-4 border-b border-light-border dark:border-dark-border">
            <Ionicons name="restaurant" size={20} color="#64748b" />
            <View className="flex-1">
              <Controller
                control={control}
                name="overtimeMealAllowance"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="Uang Makan Lembur (per hari, opsional)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={text => onChange(formatNumberInput(text))}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Overtime Transport Allowance */}
          <View className="flex-row items-center px-5 py-4">
            <Ionicons name="car" size={20} color="#64748b" />
            <View className="flex-1">
              <Controller
                control={control}
                name="overtimeTransportAllowance"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="text-white text-base p-0 m-0"
                    placeholder="Uang Transport Lembur (per hari, opsional)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={text => onChange(formatNumberInput(text))}
                    value={value}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* GROUP: Pajak PPh 21 (TER 2024) & BPJS */}
        <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Pajak PPh 21 (TER) & Iuran BPJS
        </Text>
        <View className="bg-light-card dark:bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* PTKP Status Selection */}
          <View className="px-5 py-4 border-b border-light-border dark:border-dark-border">
            <Text className="text-white font-bold text-sm mb-1">
              Status PTKP (Kategori TER PPh 21)
            </Text>
            <Text className="text-light-muted dark:text-dark-muted text-xs mb-3">
              Pilih status tanggungan keluarga untuk tarif pajak efektif 2024:
            </Text>
            <Controller
              control={control}
              name="ptkpStatus"
              render={({ field: { value, onChange } }) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2 pb-1"
                >
                  {(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'] as const).map(
                    p => {
                      const isSelected = value === p;
                      return (
                        <Pressable
                          key={p}
                          onPress={() => onChange(p)}
                          className={`px-3.5 py-2 rounded-xl border mr-2 ${
                            isSelected
                              ? 'bg-primary-600 border-primary-500'
                              : 'bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border active:bg-light-border dark:active:bg-dark-border'
                          }`}
                        >
                          <Text
                            className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-300'}`}
                          >
                            {p}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </ScrollView>
              )}
            />
          </View>

          {/* BPJS Ketenagakerjaan Switch */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
            <View className="flex-1 mr-4">
              <Text className="text-white font-bold text-sm">BPJS Ketenagakerjaan</Text>
              <Text className="text-light-muted dark:text-dark-muted text-xs mt-0.5">
                Potongan JHT 2% & Jaminan Pensiun 1%
              </Text>
            </View>
            <Controller
              control={control}
              name="hasBpjsTk"
              render={({ field: { value, onChange } }) => (
                <Switch
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor={'#ffffff'}
                  onValueChange={onChange}
                  value={value}
                />
              )}
            />
          </View>

          {/* BPJS Kesehatan Switch */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-1 mr-4">
              <Text className="text-white font-bold text-sm">BPJS Kesehatan</Text>
              <Text className="text-light-muted dark:text-dark-muted text-xs mt-0.5">
                Potongan iuran 1% karyawan
              </Text>
            </View>
            <Controller
              control={control}
              name="hasBpjsKes"
              render={({ field: { value, onChange } }) => (
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

        {/* GROUP 3: Tunjangan (Allowances) */}
        <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Tunjangan
        </Text>
        <View className="bg-light-card dark:bg-dark-card rounded-3xl overflow-hidden mb-6">
          {allowanceFields.map((field, index) => {
            const isLast = index === allowanceFields.length - 1;
            return (
              <View
                key={field.id}
                className={`p-4 ${!isLast ? 'border-b border-light-border dark:border-dark-border' : ''}`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Controller
                    control={control}
                    name={`allowancesDetail.${index}.name`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="text-white text-base flex-1 p-0 m-0 mr-4 font-bold"
                        placeholder="Nama Tunjangan (Makan, Transport...)"
                        placeholderTextColor="#64748b"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <Pressable
                    onPress={() => removeAllowance(index)}
                    className="w-8 h-8 items-center justify-center bg-red-500/10 rounded-full"
                  >
                    <Ionicons name="remove" size={16} color="#ef4444" />
                  </Pressable>
                </View>

                <View className="flex-row items-center justify-between mb-4">
                  <Ionicons name="cash" size={20} color="#10b981" />
                  <Controller
                    control={control}
                    name={`allowancesDetail.${index}.amount`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="text-white text-base flex-1 p-0 m-0"
                        placeholder="Nominal (Rp)"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        onBlur={onBlur}
                        onChangeText={text => onChange(formatNumberInput(text))}
                        value={value}
                      />
                    )}
                  />
                </View>

                <View className="flex-row items-center justify-between bg-light-bg dark:bg-dark-bg p-3 rounded-2xl">
                  <View>
                    <Text className="text-white text-sm font-medium">Tunjangan Tetap?</Text>
                    <Text className="text-light-muted dark:text-dark-muted text-[10px] mt-0.5 max-w-[200px]">
                      Aktifkan agar masuk ke dalam basis perhitungan Upah Lembur Kemenaker.
                    </Text>
                  </View>
                  <Controller
                    control={control}
                    name={`allowancesDetail.${index}.is_fixed`}
                    render={({ field: { onChange, value } }) => (
                      <Switch
                        trackColor={{ false: '#334155', true: '#3b82f6' }}
                        thumbColor={'#ffffff'}
                        onValueChange={onChange}
                        value={value || false}
                      />
                    )}
                  />
                </View>
              </View>
            );
          })}

          <Pressable
            className="flex-row items-center justify-center p-4 active:bg-light-border dark:active:bg-dark-border"
            onPress={() => appendAllowance({ id: '', name: '', amount: '', is_fixed: true })}
          >
            <Ionicons name="add-circle" size={18} color="#3b82f6" />
            <Text className="text-primary-400 font-bold text-sm uppercase tracking-wider">
              Tambah Tunjangan
            </Text>
          </Pressable>
        </View>

        {/* GROUP 4: Potongan (Deductions) */}
        <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">
          Potongan Gaji
        </Text>
        <View className="bg-light-card dark:bg-dark-card rounded-3xl overflow-hidden mb-6">
          {deductionFields.map((field, index) => {
            const isLast = index === deductionFields.length - 1;
            return (
              <View
                key={field.id}
                className={`p-4 ${!isLast ? 'border-b border-light-border dark:border-dark-border' : ''}`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Controller
                    control={control}
                    name={`deductionsDetail.${index}.name`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="text-white text-base flex-1 p-0 m-0 mr-4 font-bold"
                        placeholder="Nama Potongan (BPJS, Pajak...)"
                        placeholderTextColor="#64748b"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <Pressable
                    onPress={() => removeDeduction(index)}
                    className="w-8 h-8 items-center justify-center bg-red-500/10 rounded-full"
                  >
                    <Ionicons name="remove" size={16} color="#ef4444" />
                  </Pressable>
                </View>

                <View className="flex-row items-center justify-between">
                  <Ionicons name="remove-circle" size={20} color="#ef4444" />
                  <Controller
                    control={control}
                    name={`deductionsDetail.${index}.amount`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="text-white text-base flex-1 p-0 m-0"
                        placeholder="Nominal (Rp)"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        onBlur={onBlur}
                        onChangeText={text => onChange(formatNumberInput(text))}
                        value={value}
                      />
                    )}
                  />
                </View>
              </View>
            );
          })}

          <Pressable
            className="flex-row items-center justify-center p-4 active:bg-light-border dark:active:bg-dark-border"
            onPress={() => appendDeduction({ id: '', name: '', amount: '', is_fixed: false })}
          >
            <Ionicons name="add-circle" size={18} color="#3b82f6" />
            <Text className="text-primary-400 font-bold text-sm uppercase tracking-wider">
              Tambah Potongan
            </Text>
          </Pressable>
        </View>

        {/* Error Messages */}
        <View className="min-h-[24px] px-4 mb-4">
          {(errors.companyName || errors.basicSalary) && (
            <Text className="text-red-400 text-sm">
              {errors.companyName?.message || errors.basicSalary?.message}
            </Text>
          )}
        </View>

        <Pressable
          className={`bg-primary-600 rounded-2xl py-4 items-center mb-10 flex-row justify-center gap-2 active:opacity-70 ${isLoading ? 'opacity-50' : ''}`}
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
