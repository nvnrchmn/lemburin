import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Switch } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SymbolView } from 'expo-symbols';

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

const companySchema = z.object({
  companyName: z.string().min(2, { message: 'Nama perusahaan wajib diisi' }),
  jobTitle: z.string().optional(),
  employeeCode: z.string().optional(),
  basicSalary: z.string().min(1, { message: 'Gaji pokok wajib diisi' }),
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
      basicSalary: employment?.basic_salary ? formatNumberInput(employment.basic_salary) : '',
      allowancesDetail: employment?.allowances_detail?.map(a => ({ ...a, amount: formatNumberInput(a.amount) })) || [],
      deductionsDetail: employment?.deductions_detail?.map(d => ({ ...d, amount: formatNumberInput(d.amount) })) || [],
      startDate: employment?.start_date ? new Date(employment.start_date) : new Date(),
    },
  });

  const { fields: allowanceFields, append: appendAllowance, remove: removeAllowance } = useFieldArray({
    control,
    name: 'allowancesDetail'
  });

  const { fields: deductionFields, append: appendDeduction, remove: removeDeduction } = useFieldArray({
    control,
    name: 'deductionsDetail'
  });

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user) return;
    setIsLoading(true);

    const salaryNumber = parseNumberInput(data.basicSalary);
    
    if (isNaN(salaryNumber) || salaryNumber <= 0) {
      Alert.alert('Error', 'Gaji pokok tidak valid');
      setIsLoading(false);
      return;
    }

    const mapComponents = (arr: any[]) => arr.map((c, i) => ({
      id: c.id || `id-${Date.now()}-${i}`,
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
      basic_salary: salaryNumber,
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
        Informasi pekerjaan Anda, termasuk Gaji Pokok untuk keperluan perhitungan lembur.
      </Text>

      <View className="w-full">
        {/* GROUP 1: Informasi Pekerjaan */}
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Informasi Pekerjaan</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Company Name */}
          <View className={`flex-row items-center px-5 py-4 border-b ${errors.companyName ? 'border-red-500/50' : 'border-dark-border'}`}>
            <SymbolView name="building.2.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
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
          <View className="flex-row items-center px-5 py-4 border-b border-dark-border">
            <SymbolView name="briefcase.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
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
          <View className="flex-row items-center px-5 py-4 border-b border-dark-border">
            <SymbolView name="number.square.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
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
                  className="flex-row items-center px-5 py-4 active:bg-dark-border"
                  onPress={() => setShowDatePicker(true)}
                >
                  <SymbolView name="calendar.badge.plus" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
                  <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-white text-base">Mulai Bekerja</Text>
                    <Text className="text-primary-400 font-medium">{format(value, 'dd MMM yyyy', { locale: id })}</Text>
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

        {/* GROUP 2: Komponen Gaji */}
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4 mt-2">Komponen Upah</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {/* Basic Salary */}
          <View className={`flex-row items-center px-5 py-4 ${errors.basicSalary ? 'border-b border-red-500/50' : ''}`}>
            <SymbolView name="banknote.fill" size={20} tintColor="#64748b" style={{ marginRight: 16 }} />
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
                    onChangeText={(text) => onChange(formatNumberInput(text))}
                    value={value}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* GROUP 3: Tunjangan (Allowances) */}
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Tunjangan</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {allowanceFields.map((field, index) => {
            const isLast = index === allowanceFields.length - 1;
            return (
              <View key={field.id} className={`p-4 ${!isLast ? 'border-b border-dark-border' : ''}`}>
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
                  <Pressable onPress={() => removeAllowance(index)} className="w-8 h-8 items-center justify-center bg-red-500/10 rounded-full">
                    <SymbolView name="minus" size={16} tintColor="#ef4444" weight="bold" />
                  </Pressable>
                </View>
                
                <View className="flex-row items-center justify-between mb-4">
                  <SymbolView name="dollarsign.circle.fill" size={20} tintColor="#10b981" style={{ marginRight: 12 }} />
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
                        onChangeText={(text) => onChange(formatNumberInput(text))}
                        value={value}
                      />
                    )}
                  />
                </View>
                
                <View className="flex-row items-center justify-between bg-dark-bg p-3 rounded-2xl">
                  <View>
                    <Text className="text-white text-sm font-medium">Tunjangan Tetap?</Text>
                    <Text className="text-dark-muted text-[10px] mt-0.5 max-w-[200px]">Aktifkan agar masuk ke dalam basis perhitungan Upah Lembur Kemenaker.</Text>
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
            className="flex-row items-center justify-center p-4 active:bg-dark-border"
            onPress={() => appendAllowance({ id: '', name: '', amount: '', is_fixed: true })}
          >
            <SymbolView name="plus.circle.fill" size={18} tintColor="#3b82f6" style={{ marginRight: 8 }} />
            <Text className="text-primary-400 font-bold text-sm uppercase tracking-wider">Tambah Tunjangan</Text>
          </Pressable>
        </View>

        {/* GROUP 4: Potongan (Deductions) */}
        <Text className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2 ml-4">Potongan Gaji</Text>
        <View className="bg-dark-card rounded-3xl overflow-hidden mb-6">
          {deductionFields.map((field, index) => {
            const isLast = index === deductionFields.length - 1;
            return (
              <View key={field.id} className={`p-4 ${!isLast ? 'border-b border-dark-border' : ''}`}>
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
                  <Pressable onPress={() => removeDeduction(index)} className="w-8 h-8 items-center justify-center bg-red-500/10 rounded-full">
                    <SymbolView name="minus" size={16} tintColor="#ef4444" weight="bold" />
                  </Pressable>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <SymbolView name="minus.circle.fill" size={20} tintColor="#ef4444" style={{ marginRight: 12 }} />
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
                        onChangeText={(text) => onChange(formatNumberInput(text))}
                        value={value}
                      />
                    )}
                  />
                </View>
              </View>
            );
          })}
          
          <Pressable 
            className="flex-row items-center justify-center p-4 active:bg-dark-border"
            onPress={() => appendDeduction({ id: '', name: '', amount: '', is_fixed: false })}
          >
            <SymbolView name="plus.circle.fill" size={18} tintColor="#3b82f6" style={{ marginRight: 8 }} />
            <Text className="text-primary-400 font-bold text-sm uppercase tracking-wider">Tambah Potongan</Text>
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
