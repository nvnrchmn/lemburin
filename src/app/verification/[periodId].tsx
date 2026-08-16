import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, parseISO } from 'date-fns';

import { PayPeriod, SalaryVerification, OvertimeEntry } from '@/types/database';
import { calculateOvertimeMinutes, calculateOvertimePay, calculateTotalFixedAllowance } from '@/utils/calculator';
import { formatCurrency, formatDuration } from '@/utils/formatting';
import { pickImage } from '@/utils/upload';
import { useToastStore } from '@/stores/toast-store';

export default function SalaryVerificationScreen() {
  const { periodId } = useLocalSearchParams<{ periodId: string }>();
  const { employment, profile } = useDataStore();
  const { showToast } = useToastStore();
  
  const [verification, setVerification] = useState<SalaryVerification | null>(null);
  const [period, setPeriod] = useState<PayPeriod | null>(null);
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [slipPhotoUrl, setSlipPhotoUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [estimatedAppAmount, setEstimatedAppAmount] = useState(0);
  const [slipAmountStr, setSlipAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        const currentPeriod = periodData as PayPeriod;
        setPeriod(currentPeriod);

        // Fetch entries to calculate estimation
        const { data: entriesData, error: entriesError } = await supabase
          .from('overtime_entries')
          .select('*')
          .eq('pay_period_id', periodId)
          .order('work_date', { ascending: true });
          
        if (entriesError) throw entriesError;
        setEntries((entriesData as OvertimeEntry[]) || []);
        
        let totalPay = 0;
        (entriesData as any[] | null)?.forEach((entry) => {
          const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
          const payInfo = calculateOvertimePay(
            mins,
            currentPeriod.formula_type,
            employment.basic_salary || 0,
            calculateTotalFixedAllowance(employment.allowances_detail || null),
            currentPeriod.flat_rate_amount,
            entry.is_holiday ?? false,
            employment.work_system || '5_days',
            employment.overtime_meal_allowance || 0,
            employment.overtime_transport_allowance || 0
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
          const currentVerif = verifData as SalaryVerification;
          setVerification(currentVerif);
          setSlipAmountStr(currentVerif.slip_amount.toString());
          setNotes(currentVerif.notes || '');
          if (currentVerif.slip_photo_url) {
            setSlipPhotoUrl(currentVerif.slip_photo_url);
          }
        }

      } catch (error) {
        console.error('Failed to load verification data:', error);
        showToast('Gagal memuat data.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [periodId, employment, showToast]);

  const handlePickSlipPhoto = () => {
    Alert.alert('Foto Slip Gaji Fisik', 'Pilih sumber foto:', [
      { text: 'Kamera', onPress: async () => {
        const res = await pickImage(true);
        if (res?.base64) setSlipPhotoUrl(res.base64);
      }},
      { text: 'Galeri Foto', onPress: async () => {
        const res = await pickImage(false);
        if (res?.base64) setSlipPhotoUrl(res.base64);
      }},
      { text: 'Batal', style: 'cancel' }
    ]);
  };

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
      slip_photo_url: slipPhotoUrl,
      verified_at: new Date().toISOString(),
    };

    try {
      if (verification?.id) {
        // Update
        const { error } = await supabase
          .from('salary_verifications')
          .update(payload as any)
          .eq('id', verification.id);
        if (error) throw error;
        showToast('Verifikasi berhasil diperbarui', 'success');
      } else {
        // Insert
        const { error } = await supabase
          .from('salary_verifications')
          .insert(payload as any);
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

  const exportDisputePdf = async () => {
    if (!period || !employment) return;
    setIsExporting(true);

    try {
      const shortageAmount = Math.abs(difference);
      const rowsHtml = entries.map((entry, index) => {
        const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
        const payInfo = calculateOvertimePay(
          mins,
          period.formula_type,
          employment.basic_salary || 0,
          calculateTotalFixedAllowance(employment.allowances_detail || null),
          period.flat_rate_amount,
          entry.is_holiday ?? false,
          employment.work_system || '5_days',
          employment.overtime_meal_allowance || 0,
          employment.overtime_transport_allowance || 0
        );

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
            <td style="padding: 10px; font-size: 11px;">${format(parseISO(entry.work_date), 'dd/MM/yyyy')}</td>
            <td style="padding: 10px; font-size: 11px;">${entry.start_time.slice(0, 5)} - ${entry.end_time.slice(0, 5)}</td>
            <td style="padding: 10px; font-size: 11px;">${entry.break_minutes} mnt</td>
            <td style="padding: 10px; font-size: 11px; font-weight: 600;">${formatDuration(mins)}</td>
            <td style="padding: 10px; font-size: 11px;">${entry.is_holiday ? '<span style="color: #dc2626; font-weight: 700;">Libur</span>' : 'Kerja'}</td>
            <td style="padding: 10px; font-size: 11px; text-align: right; font-weight: 700;">${formatCurrency(payInfo.totalPay)}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Surat Pengajuan Klarifikasi Selisih Lembur</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 30px; font-size: 12px; line-height: 1.5; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; }
            .subtitle { font-size: 12px; color: #64748b; }
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f1f5f9; padding: 15px; border-radius: 8px; }
            .summary-box { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
            .summary-title { font-size: 13px; font-weight: bold; color: #991b1b; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
            .legal-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; font-size: 11px; margin-bottom: 30px; color: #1e40af; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .sign-col { width: 45%; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Surat Pengajuan Klarifikasi & Koreksi Upah Lembur</div>
            <div class="subtitle">Berdasarkan Ketentuan Peraturan Pemerintah No. 35 Tahun 2021 Pasal 31</div>
          </div>

          <div class="meta-grid">
            <div>
              <p style="margin: 0 0 4px 0;"><strong>Nama Karyawan:</strong> ${profile?.full_name || '-'}</p>
              <p style="margin: 0 0 4px 0;"><strong>No. Karyawan/ID:</strong> ${employment.employee_code || '-'}</p>
              <p style="margin: 0;"><strong>Jabatan/Posisi:</strong> ${employment.job_title || '-'}</p>
            </div>
            <div>
              <p style="margin: 0 0 4px 0;"><strong>Perusahaan:</strong> ${employment.company_name}</p>
              <p style="margin: 0 0 4px 0;"><strong>Periode Gaji:</strong> ${period.period_name}</p>
              <p style="margin: 0;"><strong>Sistem Kerja:</strong> ${employment.work_system === '6_days' ? '6 Hari Kerja' : '5 Hari Kerja'}</p>
            </div>
          </div>

          <div class="summary-box">
            <div class="summary-title">RINGKASAN REKAPITULASI SELISIH</div>
            <p style="margin: 0 0 4px 0;">Hak Upah Lembur (Sesuai PP 35/2021): <strong>${formatCurrency(estimatedAppAmount)}</strong></p>
            <p style="margin: 0 0 4px 0;">Upah Lembur pada Slip Diterima: <strong>${formatCurrency(slipAmount)}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #b91c1c;"><strong>Kekurangan Bayar yang Diklaim: ${formatCurrency(shortageAmount)}</strong></p>
          </div>

          <div class="legal-note">
            <strong>Dasar Hukum:</strong> Perhitungan upah lembur di atas disusun secara baku berdasarkan formula upah sejam <code>(Upah Pokok + Tunjangan Tetap) / 173</code> dan faktor pengali lembur hari kerja & hari libur resmi sesuai ketentuan <strong>Pasal 31 PP No. 35 Tahun 2021</strong>.
          </div>

          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jam Lembur</th>
                <th>Istirahat</th>
                <th>Durasi Bersih</th>
                <th>Jenis Hari</th>
                <th style="text-align: right;">Hak Upah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          ${notes ? `<p style="font-size: 11px; color: #475569; margin-bottom: 20px;"><strong>Catatan Karyawan:</strong> ${notes}</p>` : ''}

          <div class="signatures">
            <div class="sign-col">
              <p style="margin-bottom: 60px;">Diajukan Oleh,</p>
              <p style="font-weight: bold; text-decoration: underline;">${profile?.full_name || 'Karyawan'}</p>
            </div>
            <div class="sign-col">
              <p style="margin-bottom: 60px;">Diterima Oleh (HRD/Payroll),</p>
              <p>( _______________________ )</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err: any) {
      Alert.alert('Gagal Ekspor PDF', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsExporting(false);
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

        {/* Lampiran Foto Slip Gaji Fisik */}
        <View className="bg-dark-card border border-dark-border rounded-3xl p-4 mb-6 shadow-sm">
          <Text className="text-dark-muted font-sans-bold text-xs uppercase tracking-wider mb-3">
            Foto Slip Gaji Fisik (Opsional)
          </Text>
          {slipPhotoUrl ? (
            <View className="relative">
              <Image 
                source={{ uri: slipPhotoUrl }} 
                className="w-full h-44 rounded-2xl bg-dark-bg" 
                resizeMode="cover"
              />
              <View className="flex-row gap-2 absolute top-2 right-2">
                <Pressable
                  className="bg-primary-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1 shadow-lg"
                  onPress={() => setIsModalOpen(true)}
                >
                  <SymbolView name="arrow.up.left.and.arrow.down.right" size={12} tintColor="#fff" />
                  <Text className="text-white text-xs font-bold">Perbesar</Text>
                </Pressable>
                <Pressable
                  className="bg-red-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1 shadow-lg"
                  onPress={() => setSlipPhotoUrl(null)}
                >
                  <SymbolView name="trash.fill" size={12} tintColor="#fff" />
                  <Text className="text-white text-xs font-bold">Hapus</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              className="border border-dashed border-dark-border rounded-2xl py-6 items-center justify-center active:bg-dark-border/40"
              onPress={handlePickSlipPhoto}
            >
              <View className="w-12 h-12 bg-primary-950/40 rounded-full items-center justify-center mb-2 border border-primary-500/30">
                <SymbolView name="camera.fill" size={22} tintColor="#60a5fa" />
              </View>
              <Text className="text-white font-bold text-sm">Ambil Foto Slip Gaji</Text>
              <Text className="text-dark-muted text-xs mt-0.5">Untuk perbandingan visual berdampingan</Text>
            </Pressable>
          )}
        </View>

        {/* Result Status Panel */}
        <View className={`border rounded-3xl p-5 mb-4 ${statusBg}`}>
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

        {/* Dispute Resolution PDF Button (If Shortage) */}
        {difference < 0 && (
          <Pressable
            onPress={exportDisputePdf}
            disabled={isExporting}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex-row items-center justify-between active:bg-red-500/20"
          >
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <SymbolView name="doc.badge.arrow.up" size={16} tintColor="#f87171" />
                <Text className="text-red-400 font-bold text-sm">Cetak Surat Klaim Selisih (PDF)</Text>
              </View>
              <Text className="text-red-300/70 text-xs">
                Dokumen resmi berlandaskan Pasal 31 PP 35/2021 untuk diajukan ke HRD/Payroll
              </Text>
            </View>
            {isExporting ? (
              <ActivityIndicator color="#f87171" size="small" />
            ) : (
              <View className="w-9 h-9 bg-red-500/20 rounded-xl items-center justify-center">
                <SymbolView name="arrow.down.doc.fill" size={16} tintColor="#f87171" />
              </View>
            )}
          </Pressable>
        )}

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

      {/* Slip Photo Zoom Modal */}
      {slipPhotoUrl && (
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center p-4">
            <Pressable 
              className="absolute top-12 right-6 z-10 bg-dark-card p-3 rounded-full border border-dark-border"
              onPress={() => setIsModalOpen(false)}
            >
              <SymbolView name="xmark" size={20} tintColor="#fff" />
            </Pressable>
            <Image 
              source={{ uri: slipPhotoUrl }}
              className="w-full h-4/5 rounded-2xl"
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
