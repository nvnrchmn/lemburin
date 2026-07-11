import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { SymbolView } from 'expo-symbols';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { PayPeriod, OvertimeEntry } from '@/types/database';
import { calculateOvertimeMinutes, calculateOvertimePay, calculateTotalFixedAllowance } from '@/utils/calculator';
import { formatCurrency, formatDuration } from '@/utils/formatting';

export default function MonthlySummaryScreen() {
  const { periodId } = useLocalSearchParams<{ periodId: string }>();
  const { employment, profile } = useDataStore();
  
  const [period, setPeriod] = useState<PayPeriod | null>(null);
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!periodId) return;
      try {
        // Fetch period
        const { data: periodData, error: periodError } = await supabase
          .from('pay_periods')
          .select('*')
          .eq('id', periodId)
          .single();
          
        if (periodError) throw periodError;
        setPeriod(periodData);

        // Fetch entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('overtime_entries')
          .select('*')
          .eq('pay_period_id', periodId)
          .order('work_date', { ascending: true });
          
        if (entriesError) throw entriesError;
        setEntries(entriesData || []);

      } catch (error) {
        console.error('Failed to load summary data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [periodId]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  if (!period) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center px-5">
        <Text className="text-white text-lg">Periode tidak ditemukan.</Text>
        <Pressable className="mt-4 bg-primary-600 px-6 py-3 rounded-xl" onPress={() => router.back()}>
          <Text className="text-white font-bold">Kembali</Text>
        </Pressable>
      </View>
    );
  }

  // Calculate stats
  let totalMinutes = 0;
  let totalPay = 0;
  const daysOfOvertime = new Set(entries.map(e => e.work_date)).size;

  entries.forEach(entry => {
    const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
    totalMinutes += mins;
    
    if (employment?.basic_salary) {
      const payInfo = calculateOvertimePay(
        mins,
        period.formula_type,
        employment.basic_salary,
        calculateTotalFixedAllowance(employment.allowances_detail || null),
        period.flat_rate_amount,
        false // we don't have holiday flag stored yet, assume false
      );
      totalPay += payInfo.totalPay;
    }
  });

  const formulaName = period.formula_type === 'indonesia' ? 'Formula Kemenaker' : 'Tarif Flat';

  const exportPDF = async () => {
    try {
      setIsLoading(true);
      
      let tableRows = '';
      entries.forEach(entry => {
        const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
        const dateStr = format(parseISO(entry.work_date), 'dd MMM yyyy', { locale: localeId });
        tableRows += `
          <tr>
            <td>${dateStr}</td>
            <td>${entry.start_time.slice(0, 5)} - ${entry.end_time.slice(0, 5)}</td>
            <td>${formatDuration(mins)}</td>
          </tr>
        `;
      });

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
              h1 { color: #0f172a; margin-bottom: 5px; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
              .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
              th { background-color: #f1f5f9; color: #475569; font-weight: bold; }
              .total { font-size: 24px; font-weight: bold; color: #2563eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Laporan Lembur</h1>
              <p>Periode: <strong>${period.period_name}</strong><br/>
              Karyawan: <strong>${profile?.full_name || 'Karyawan'}</strong><br/>
              Perusahaan: <strong>${employment?.company_name || '-'}</strong></p>
            </div>
            
            <div class="summary-box">
              <p>Total Jam Lembur: <strong>${formatDuration(totalMinutes)}</strong></p>
              <p>Jumlah Hari Lembur: <strong>${daysOfOvertime} Hari</strong></p>
              <p style="margin-bottom: 5px;">Estimasi Upah (${formulaName}):</p>
              <p class="total">${formatCurrency(totalPay)}</p>
            </div>

            <h2>Rincian Lembur</h2>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jam Kerja</th>
                  <th>Durasi Bersih</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || '<tr><td colspan="3" style="text-align:center">Tidak ada data lembur</td></tr>'}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (error) {
      console.error(error);
      Alert.alert('Gagal', 'Gagal membuat file PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      <View className="px-5 pt-6">
        {/* Period Header */}
        <View className="bg-primary-950 border border-primary-800 rounded-3xl p-6 mb-4 shadow-sm flex-row justify-between items-center">
          <View>
            <Text className="text-primary-300 text-xs font-bold mb-1 tracking-widest uppercase">
              RINGKASAN PERIODE
            </Text>
            <Text className="text-white text-2xl font-sans-bold">{period.period_name}</Text>
            <Text className="text-dark-muted text-sm mt-1">
              {format(parseISO(period.start_date), 'dd MMM', { locale: localeId })} — {format(parseISO(period.end_date), 'dd MMM yyyy', { locale: localeId })}
            </Text>
          </View>
          <Pressable 
            onPress={exportPDF}
            className="w-12 h-12 bg-primary-600 rounded-2xl items-center justify-center active:bg-primary-700"
          >
            <SymbolView name="square.and.arrow.up" size={20} tintColor="#fff" />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-dark-card border border-dark-border rounded-3xl p-5">
            <Text className="text-dark-muted text-xs font-medium uppercase tracking-wider mb-2">Total Jam</Text>
            <Text className="text-white text-2xl font-sans-extrabold">{formatDuration(totalMinutes).replace(' jam', 'j').replace(' menit', 'm')}</Text>
          </View>
          <View className="flex-1 bg-dark-card border border-dark-border rounded-3xl p-5">
            <Text className="text-dark-muted text-xs font-medium uppercase tracking-wider mb-2">Hari Lembur</Text>
            <Text className="text-white text-2xl font-sans-extrabold">{daysOfOvertime}</Text>
          </View>
        </View>

        {/* Total Estimation */}
        <View className="bg-primary-900/30 border border-primary-900/50 rounded-3xl p-6 mb-6 shadow-sm">
          <Text className="text-primary-300 text-xs font-bold mb-2 tracking-widest uppercase">
            TOTAL ESTIMASI UPAH
          </Text>
          <Text className="text-white text-4xl font-sans-extrabold tracking-tight mb-1">{formatCurrency(totalPay)}</Text>
          <View className="flex-row items-center">
            <SymbolView name="function" size={12} tintColor="#60a5fa" style={{ marginRight: 6 }} />
            <Text className="text-primary-200/70 text-xs font-medium">
              {formulaName}
            </Text>
          </View>
        </View>

        {/* Overtime List */}
        <View className="mb-6">
          <Text className="text-white text-xl font-sans-bold mb-4 ml-1">
            Daftar Lembur
          </Text>
          {entries.length === 0 ? (
            <View className="bg-dark-card border border-dark-border rounded-3xl p-8 items-center border-dashed">
              <Text className="text-dark-muted text-sm text-center">
                Belum ada catatan lembur pada periode ini.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {entries.map(entry => {
                const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
                return (
                  <Pressable 
                    key={entry.id} 
                    className="bg-dark-card border border-dark-border rounded-3xl p-5 flex-row justify-between items-center active:border-primary-500/50"
                    onPress={() => router.push(`/overtime/${entry.id}` as any)}
                  >
                    <View>
                      <Text className="text-white font-sans-bold text-base mb-1">
                        {format(parseISO(entry.work_date), 'dd MMM yyyy', { locale: localeId })}
                      </Text>
                      <Text className="text-dark-muted text-xs">
                        {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-primary-400 font-sans-bold text-base">+{formatDuration(mins)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Verify Button */}
        <Pressable
          className="bg-primary-600 rounded-2xl py-4 items-center mb-8 flex-row justify-center active:opacity-70 shadow-sm"
          onPress={() =>
            router.push(`/verification/${period.id}` as any)
          }
        >
          <Text className="text-white font-bold text-lg mr-2">
            Verifikasi Slip Gaji
          </Text>
          <SymbolView name="checkmark.seal.fill" size={20} tintColor="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}
