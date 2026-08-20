import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { useToastStore } from '@/stores/toast-store';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { PayPeriod, OvertimeEntry } from '@/types/database';
import {
  calculateOvertimeMinutes,
  calculateOvertimePay,
  calculateTotalFixedAllowance,
} from '@/utils/calculator';
import { formatCurrency, formatDuration } from '@/utils/formatting';
import { calculatePph21Ter } from '@/utils/tax';
import { calculateBpjsDeductions } from '@/utils/bpjs';

export default function MonthlySummaryScreen() {
  const { periodId } = useLocalSearchParams<{ periodId: string }>();
  const { employment, profile } = useDataStore();
  const { showToast } = useToastStore();

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
      <View className="flex-1 bg-light-bg dark:bg-dark-bg justify-center items-center">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  if (!period) {
    return (
      <View className="flex-1 bg-light-bg dark:bg-dark-bg justify-center items-center px-5">
        <Text className="text-white text-lg">Periode tidak ditemukan.</Text>
        <Pressable
          className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
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
        entry.is_holiday ?? false,
        employment.work_system || '5_days',
        employment.overtime_meal_allowance || 0,
        employment.overtime_transport_allowance || 0,
      );
      totalPay += payInfo.totalPay;
    }
  });

  const baseSalary = employment?.basic_salary || 0;
  const fixedAllowances = calculateTotalFixedAllowance(employment?.allowances_detail || null);
  const grossIncome = baseSalary + fixedAllowances + totalPay;

  const taxResult = calculatePph21Ter(grossIncome, employment?.ptkp_status || 'TK/0');
  const bpjsResult = calculateBpjsDeductions(
    baseSalary,
    fixedAllowances,
    employment?.has_bpjs_tk ?? true,
    employment?.has_bpjs_kes ?? true,
  );
  const otherDeductions = employment?.deductions_detail?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalDeductions = taxResult.taxAmount + bpjsResult.totalBpjs + otherDeductions;
  const takeHomePay = Math.max(0, grossIncome - totalDeductions);

  const formulaName = period.formula_type === 'indonesia' ? 'Formula Kemenaker' : 'Tarif Flat';

  const generateWhatsAppText = () => {
    let text = `*Rekap Lembur - ${profile?.full_name || 'Karyawan'}*\n`;
    text += `🏢 Perusahaan: ${employment?.company_name || '-'}\n`;
    text += `📅 Periode: ${period.period_name} (${format(parseISO(period.start_date), 'dd MMM', { locale: localeId })} - ${format(parseISO(period.end_date), 'dd MMM yyyy', { locale: localeId })})\n`;
    text += `------------------------------------\n`;
    text += `⏱️ Total Durasi: *${formatDuration(totalMinutes)}*\n`;
    text += `📆 Jumlah Hari: *${daysOfOvertime} Hari*\n`;
    text += `💰 Estimasi Upah: *${formatCurrency(totalPay)}*\n`;
    text += `------------------------------------\n`;
    text += `*Rincian Lembur:*\n`;

    entries.forEach((entry, idx) => {
      const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
      const dateStr = format(parseISO(entry.work_date), 'dd/MM/yyyy');
      const holStr = entry.is_holiday ? ' 🔴 [Hari Libur]' : '';
      text += `${idx + 1}. ${dateStr}: ${entry.start_time.slice(0, 5)} - ${entry.end_time.slice(0, 5)} (${formatDuration(mins)})${holStr}\n`;
    });

    text += `\n_Dibuat otomatis via Lemburin App_`;
    return text;
  };

  const shareWhatsApp = async () => {
    try {
      const message = generateWhatsAppText();
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch {
      showToast('Gagal membuka WhatsApp', 'error');
    }
  };

  const exportPDF = async () => {
    try {
      setIsLoading(true);

      let tableRows = '';
      entries.forEach(entry => {
        const mins = calculateOvertimeMinutes(
          entry.start_time,
          entry.end_time,
          entry.break_minutes,
        );
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
    <ScrollView className="flex-1 bg-light-bg dark:bg-dark-bg" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-6 pb-10">
        {/* Period Header */}
        <View className="bg-primary-950 border border-primary-800 rounded-3xl p-6 mb-4 shadow-sm">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-primary-300 text-xs font-bold mb-1 tracking-widest uppercase">
                RINGKASAN PERIODE
              </Text>
              <Text className="text-white text-2xl font-sans-bold">{period.period_name}</Text>
              <Text className="text-light-muted dark:text-dark-muted text-sm mt-1">
                {format(parseISO(period.start_date), 'dd MMM', { locale: localeId })} —{' '}
                {format(parseISO(period.end_date), 'dd MMM yyyy', { locale: localeId })}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={shareWhatsApp}
                className="w-11 h-11 bg-emerald-600 rounded-2xl items-center justify-center active:bg-emerald-700 shadow-sm"
              >
                <Ionicons name="chatbubbles" size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={exportPDF}
                className="w-11 h-11 bg-primary-600 rounded-2xl items-center justify-center active:bg-primary-700 shadow-sm"
              >
                <Ionicons name="share" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Quick Action Button */}
          <Pressable
            onPress={shareWhatsApp}
            className="bg-emerald-600/20 border border-emerald-500/40 rounded-2xl py-2.5 px-4 flex-row items-center justify-center active:bg-emerald-600/30"
          >
            <Ionicons name="paper-plane" size={14} color="#34d399" />
            <Text className="text-emerald-300 font-bold text-xs">Bagikan Rekap ke WhatsApp</Text>
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-5">
            <Text className="text-light-muted dark:text-dark-muted text-xs font-medium uppercase tracking-wider mb-2">
              Total Jam
            </Text>
            <Text className="text-white text-2xl font-sans-extrabold">
              {formatDuration(totalMinutes).replace(' jam', 'j').replace(' menit', 'm')}
            </Text>
          </View>
          <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-5">
            <Text className="text-light-muted dark:text-dark-muted text-xs font-medium uppercase tracking-wider mb-2">
              Hari Lembur
            </Text>
            <Text className="text-white text-2xl font-sans-extrabold">{daysOfOvertime}</Text>
          </View>
        </View>

        {/* Total Estimation */}
        <View className="bg-primary-900/30 border border-primary-900/50 rounded-3xl p-6 mb-4 shadow-sm">
          <Text className="text-primary-300 text-xs font-bold mb-2 tracking-widest uppercase">
            TOTAL ESTIMASI UPAH LEMBUR
          </Text>
          <Text className="text-white text-4xl font-sans-extrabold tracking-tight mb-1">
            {formatCurrency(totalPay)}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="calculator" size={12} color="#60a5fa" />
            <Text className="text-primary-200/70 text-xs font-medium">{formulaName}</Text>
          </View>
        </View>

        {/* Take-Home Pay & Tax Breakdown Card */}
        {employment?.basic_salary && (
          <View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 mb-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-4 border-b border-light-border dark:border-dark-border pb-3">
              <View>
                <Text className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Estimasi Gaji Bersih
                </Text>
                <Text className="text-white text-2xl font-sans-extrabold mt-0.5">
                  {formatCurrency(takeHomePay)}
                </Text>
              </View>
              <View className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <Text className="text-emerald-400 text-xs font-bold">Take Home Pay</Text>
              </View>
            </View>

            <View className="space-y-2.5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-light-muted dark:text-dark-muted text-xs">
                  Penghasilan Bruto (Gaji + Lembur)
                </Text>
                <Text className="text-white text-xs font-bold">{formatCurrency(grossIncome)}</Text>
              </View>

              {taxResult.taxAmount > 0 && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-red-400 text-xs">
                    Potongan PPh 21 TER ({taxResult.ratePercentage}%)
                  </Text>
                  <Text className="text-red-400 text-xs font-bold">
                    -{formatCurrency(taxResult.taxAmount)}
                  </Text>
                </View>
              )}

              {bpjsResult.totalBpjs > 0 && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-amber-400 text-xs">Potongan BPJS (JHT, JP, Kes)</Text>
                  <Text className="text-amber-400 text-xs font-bold">
                    -{formatCurrency(bpjsResult.totalBpjs)}
                  </Text>
                </View>
              )}

              {otherDeductions > 0 && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-red-400 text-xs">Potongan Lainnya</Text>
                  <Text className="text-red-400 text-xs font-bold">
                    -{formatCurrency(otherDeductions)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Overtime List */}
        <View className="mb-6">
          <Text className="text-light-text dark:text-white text-xl font-sans-bold mb-5 ml-1">
            Daftar Lembur
          </Text>
          {entries.length === 0 ? (
            <View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-8 items-center border-dashed">
              <Text className="text-light-muted dark:text-dark-muted text-sm text-center">
                Belum ada catatan lembur pada periode ini.
              </Text>
            </View>
          ) : (
            <View>
              {entries.map((entry, index) => {
                const mins = calculateOvertimeMinutes(
                  entry.start_time,
                  entry.end_time,
                  entry.break_minutes,
                );
                return (
                  <Pressable
                    key={entry.id}
                    className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-5 flex-row justify-between items-center active:border-primary-500/50"
                    style={{ marginBottom: index === entries.length - 1 ? 0 : 14 }}
                    onPress={() => router.push(`/overtime/${entry.id}` as any)}
                  >
                    <View>
                      <Text className="text-white font-sans-bold text-base mb-1">
                        {format(parseISO(entry.work_date), 'dd MMM yyyy', { locale: localeId })}
                      </Text>
                      <Text className="text-light-muted dark:text-dark-muted text-xs">
                        {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-primary-400 font-sans-bold text-base">
                        +{formatDuration(mins)}
                      </Text>
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
          onPress={() => router.push(`/verification/${period.id}` as any)}
        >
          <Text className="text-white font-bold text-lg mr-2">Verifikasi Slip Gaji</Text>
          <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}
