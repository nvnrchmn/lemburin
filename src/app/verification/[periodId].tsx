import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

import { PayPeriod, SalaryVerification } from '@/types/database';
import { calculateOvertimeMinutes, calculateOvertimePay, calculateTotalFixedAllowance } from '@/utils/calculator';
import { formatCurrency } from '@/utils/formatting';
import { useToastStore } from '@/stores/toast-store';

export default function SalaryVerificationScreen() {
  const { periodId } = useLocalSearchParams<{ periodId: string }>();
  const { employment } = useDataStore();
  const { showToast } = useToastStore();
  
  const [period, setPeriod] = useState<PayPeriod | null>(null);
  const [verification, setVerification] = useState<SalaryVerification | null>(null);
  
  const [estimatedAppAmount, setEstimatedAppAmount] = useState(0);
  const [slipAmountStr, setSlipAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!periodId || !employment) return;
      try {
        // Fetch period
        const { data: periodData, error: periodError } = await supabase
          .from('pay_periods')
          .select('*')
          .eq('id', periodId)
          .single();
          
        if (periodError) throw periodError;
        setPeriod(periodData);

        // Fetch entries to calculate estimation
        const { data: entriesData, error: entriesError } = await supabase
          .from('overtime_entries')
          .select('*')
          .eq('pay_period_id', periodId);
          
        if (entriesError) throw entriesError;
        
        let totalPay = 0;
        entriesData?.forEach(entry => {
          const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
          const payInfo = calculateOvertimePay(
            mins,
            periodData.formula_type,
            employment.basic_salary || 0,
            calculateTotalFixedAllowance(employment.allowances_detail || null),
            periodData.flat_rate_amount,
            false // no holiday support implemented fully yet
          );
          totalPay += payInfo.totalPay;
        });
        
        setEstimatedAppAmount(totalPay);

        // Fetch existing verification
        const { data: verifData, error: verifError } = await supabase
          .from('salary_verifications')
          .select('*')
          .eq('pay_period_id', periodId)
          .maybeSingle();

        if (verifError && verifError.code !== 'PGRST116') throw verifError;
        
        if (verifData) {
          setVerification(verifData);
          setSlipAmountStr(verifData.slip_amount.toString());
          setNotes(verifData.notes || '');
        }

      } catch (error) {
        console.error('Failed to load verification data:', error);
        showToast('Gagal memuat data.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [periodId, employment]);

  const slipAmount = parseInt(slipAmountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const difference = slipAmount - estimatedAppAmount;
  const diffPercentage = estimatedAppAmount > 0 
    ? (Math.abs(difference) / estimatedAppAmount) * 100 
    : 0;

  let statusText = 'Belum Diverifikasi';
  let statusColor = '#94a3b8'; // slate-400
  let statusBg = 'bg-slate-500/10 border-slate-500/20';

  if (slipAmountStr.length > 0) {
    if (difference === 0) {
      statusText = 'Cocok (Sesuai)';
      statusColor = '#4ade80'; // green-400
      statusBg = 'bg-emerald-500/10 border-emerald-500/20';
    } else {
      statusText = 'Tidak Cocok (Selisih)';
      statusColor = '#f87171'; // red-400
      statusBg = 'bg-red-500/10 border-red-500/20';
    }
  }

  const handleSave = async () => {
    if (!periodId) return;
    
    if (slipAmountStr.trim() === '') {
      Alert.alert('Perhatian', 'Mohon isi nominal pada slip gaji.');
      return;
    }

    setIsSaving(true);
    
    const payload = {
      pay_period_id: periodId,
      slip_amount: slipAmount,
      difference: difference,
      deduction: 0,
      notes: notes.trim() || null,
      verified_at: new Date().toISOString(),
    };

    try {
      if (verification?.id) {
        // Update
        const { error } = await supabase
          .from('salary_verifications')
          .update(payload)
          .eq('id', verification.id);
        if (error) throw error;
        showToast('Verifikasi berhasil diperbarui', 'success');
      } else {
        // Insert
        const { error } = await supabase
          .from('salary_verifications')
          .insert(payload);
        if (error) throw error;
        showToast('Verifikasi berhasil disimpan', 'success');
      }
      
      router.back();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Gagal menyimpan verifikasi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-bg" showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInUp.duration(600).springify()} layout={Layout.springify()} className="px-5 pt-6 pb-12">
        <Text className="text-white text-3xl font-sans-bold tracking-tight mb-2">
          Verifikasi Gaji
        </Text>
        <Text className="text-dark-muted font-medium text-sm mb-6">
          Bandingkan estimasi dari aplikasi dengan nominal asli yang tertera pada slip gaji Anda.
        </Text>

        {/* Comparison Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-primary-950 border border-primary-800 rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center mb-2">
              <SymbolView name="iphone" size={14} tintColor="#93c5fd" style={{ marginRight: 6 }} />
              <Text className="text-primary-300 font-sans-bold text-xs uppercase tracking-wider">Aplikasi</Text>
            </View>
            <Text className="text-white text-xl font-sans-extrabold">{formatCurrency(estimatedAppAmount)}</Text>
          </View>
          <View className="flex-1 bg-dark-card border border-dark-border rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center mb-2">
              <SymbolView name="doc.text.fill" size={14} tintColor="#94a3b8" style={{ marginRight: 6 }} />
              <Text className="text-dark-muted font-sans-bold text-xs uppercase tracking-wider">Slip Gaji</Text>
            </View>
            <Text className="text-white text-xl font-sans-extrabold">{slipAmount > 0 ? formatCurrency(slipAmount) : 'Rp —'}</Text>
          </View>
        </View>

        {/* Input Slip Amount */}
        <View className="bg-dark-card border border-dark-border rounded-3xl px-5 py-4 mb-6 shadow-sm">
          <Text className="text-dark-muted font-sans-bold text-xs uppercase tracking-wider mb-2">
            Nominal Lembur pada Slip Gaji
          </Text>
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-sans-extrabold mr-2">Rp</Text>
            <TextInput
              className="flex-1 text-white text-xl font-sans-extrabold p-0 m-0"
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              value={slipAmountStr}
              onChangeText={(text) => {
                // Keep only numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                setSlipAmountStr(numericValue);
              }}
            />
          </View>
        </View>

        {/* Result Status Panel */}
        <View className={`border rounded-3xl p-5 mb-6 ${statusBg}`}>
          <View className="flex-row items-center justify-between mb-4 border-b border-white/10 pb-4">
            <Text className="text-dark-muted font-medium text-sm">Status Kecocokan</Text>
            <Text style={{ color: statusColor }} className="text-base font-sans-bold">
              {statusText}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-dark-muted font-medium text-sm">Selisih Nominal</Text>
            <Text className={`text-lg font-sans-extrabold ${difference < 0 ? 'text-red-400' : difference > 0 ? 'text-emerald-400' : 'text-white'}`}>
              {difference > 0 ? '+' : ''}{formatCurrency(difference)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-dark-muted font-medium text-sm">Persentase Deviasi</Text>
            <Text className="text-white text-lg font-sans-extrabold">{diffPercentage.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Notes */}
        <View className="bg-dark-card border border-dark-border rounded-3xl px-5 py-4 mb-8 shadow-sm">
          <Text className="text-dark-muted font-sans-bold text-xs uppercase tracking-wider mb-2">Catatan (opsional)</Text>
          <TextInput
            className="text-white text-base p-0 m-0 w-full"
            style={{ minHeight: 60, maxHeight: 120 }}
            placeholder="Tambahkan catatan jika ada selisih..."
            placeholderTextColor="#475569"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <Pressable
          className={`bg-primary-600 rounded-2xl py-4 items-center flex-row justify-center active:opacity-70 shadow-sm ${isSaving ? 'opacity-50' : ''}`}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
          <Text className="text-white font-sans-bold text-lg">
            {verification ? 'Perbarui Verifikasi' : 'Simpan Verifikasi'}
          </Text>
          {!isSaving && <SymbolView name="checkmark.circle.fill" size={20} tintColor="#fff" style={{ marginLeft: 8 }} />}
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
