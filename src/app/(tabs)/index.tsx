import { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { id as localeId, enUS as localeEn } from 'date-fns/locale';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';

import { useDataStore } from '@/stores/data-store';
import { useSettingsStore } from '@/stores/settings-store';
import { formatCurrency, formatDuration } from '@/utils/formatting';
import { calculateOvertimeMinutes, calculateOvertimePay, calculateTotalFixedAllowance, calculateTotalDeduction } from '@/utils/calculator';
import { syncService } from '@/services/sync-service';
import { t } from '@/utils/i18n';

export default function DashboardScreen() {
  const { profile, employment, activePayPeriod, overtimeEntries } = useDataStore();
  const { language, currency } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncService();
    setRefreshing(false);
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  const stats = useMemo(() => {
    if (!activePayPeriod) return { days: 0, hoursStr: '0 jam', totalPay: 0, weeklyHours: 0 };

    let totalMins = 0;
    let totalPay = 0;
    let weeklyMins = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    overtimeEntries.forEach(entry => {
      const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
      totalMins += mins;

      const entryDate = new Date(entry.work_date);
      if (entryDate >= sevenDaysAgo && !entry.is_holiday) {
        weeklyMins += mins;
      }
      
      const payInfo = calculateOvertimePay(
        mins,
        activePayPeriod.formula_type,
        employment?.basic_salary || 0,
        calculateTotalFixedAllowance(employment?.allowances_detail || null),
        activePayPeriod.flat_rate_amount,
        entry.is_holiday ?? false,
        employment?.work_system || '5_days',
        employment?.overtime_meal_allowance || 0,
        employment?.overtime_transport_allowance || 0
      );
      totalPay += payInfo.totalPay;
    });

    return {
      days: overtimeEntries.length,
      hoursStr: formatDuration(totalMins),
      totalPay,
      weeklyHours: weeklyMins / 60
    };
  }, [overtimeEntries, activePayPeriod, employment]);

  const isPeriodExpired = useMemo(() => {
    if (!activePayPeriod?.end_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return today > activePayPeriod.end_date;
  }, [activePayPeriod]);

  const recentEntries = useMemo(() => {
    return [...overtimeEntries].sort((a, b) => 
      new Date(b.work_date).getTime() - new Date(a.work_date).getTime()
    ).slice(0, 3);
  }, [overtimeEntries]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const entry = overtimeEntries.find(e => e.work_date === dateStr);
      let hours = 0;
      if (entry) {
        hours = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes) / 60;
      }
      
      data.push({
        value: hours,
        label: format(d, 'EE', { locale: language === 'en' ? localeEn : localeId }),
        frontColor: hours > 0 ? '#3b82f6' : '#1e293b',
        topLabelComponent: () => hours > 0 ? (
          <Text className="text-white text-[10px] font-bold mb-1">{hours.toFixed(1)}</Text>
        ) : null,
      });
    }
    return data;
  }, [overtimeEntries, language]);

  return (
    <ScrollView 
      className="flex-1 bg-dark-bg"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <View className="px-5 pt-20 pb-4 flex-row justify-between items-end">
        <View>
          <Text className="text-dark-muted text-xs font-sans-bold mb-1 uppercase tracking-widest">{t('welcome', language)}</Text>
          <Text className="text-white text-4xl font-sans-extrabold tracking-tight">
            {firstName}
          </Text>
        </View>
        <Pressable 
          onPress={() => router.push('/(tabs)/settings')}
          className="w-12 h-12 bg-dark-card rounded-full items-center justify-center overflow-hidden active:opacity-70"
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
          ) : (
            <Ionicons name="person-circle" size={48} color="#3b82f6" />
          )}
        </Pressable>
      </View>

      {/* Hero Card (Estimasi Upah) */}
      <Animated.View entering={FadeInDown.duration(600).springify()}>
        <View className="mx-5 mb-6 shadow-2xl shadow-primary-900/40 rounded-3xl overflow-hidden">
        <LinearGradient
          colors={['#2563eb', '#1e40af', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.5 }}
          style={{ padding: 32, position: 'relative' }}
        >
          {/* Background Decorative Element */}
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center gap-2">
              <View className="bg-white/20 p-2 rounded-xl">
                <Ionicons name="cash" size={20} color="#fff" />
              </View>
              <Text className="text-primary-100 text-sm font-medium uppercase tracking-widest">
                {t('estimatedPay', language)}
              </Text>
            </View>
            <View className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <Text className="text-white text-xs font-bold">{currency}</Text>
            </View>
          </View>

          <Text className="text-white text-5xl font-sans-extrabold tracking-tighter mb-8" numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats.totalPay, currency).replace(currency, '').trim()}
          </Text>

          {/* Additional detail for Take Home Pay? Or at least show deductions? */}
          {employment?.deductions_detail && employment.deductions_detail.length > 0 && (
            <View className="mb-6 flex-row items-center bg-red-500/10 self-start px-3 py-1.5 rounded-full border border-red-500/20">
              <Ionicons name="remove-circle" size={12} color="#ef4444" style={{ marginRight: 6 }} />
              <Text className="text-red-400 text-xs font-bold">
                Total Potongan: {formatCurrency(calculateTotalDeduction(employment.deductions_detail), currency)}
              </Text>
            </View>
          )}

          {/* K3 / PP 35/2021 Safety Warning Badge */}
          {stats.weeklyHours >= 18 ? (
            <View className="mb-4 flex-row items-center bg-amber-500/20 px-3.5 py-2 rounded-2xl border border-amber-500/30">
              <Ionicons name="warning" size={16} color="#fbbf24" style={{ marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-amber-300 text-xs font-bold">Peringatan Beban Lembur K3</Text>
                <Text className="text-amber-200/80 text-[11px]">
                  Lembur minggu ini ({stats.weeklyHours.toFixed(1)} jam) telah mencapai batas maksimal regulasi PP 35/2021 (18 jam/minggu). Jaga kesehatan Anda!
                </Text>
              </View>
            </View>
          ) : stats.weeklyHours >= 14 ? (
            <View className="mb-4 flex-row items-center bg-blue-500/10 px-3.5 py-1.5 rounded-2xl border border-blue-500/20">
              <Ionicons name="information-circle" size={15} color="#60a5fa" style={{ marginRight: 8 }} />
              <Text className="text-blue-200 text-xs">
                Lembur minggu ini: <Text className="font-bold text-white">{stats.weeklyHours.toFixed(1)} / 18 jam</Text> (PP 35/2021)
              </Text>
            </View>
          ) : null}

          {/* Expired Period Rollover Prompt */}
          {isPeriodExpired && activePayPeriod && (
            <View className="mb-4 bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30 flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-emerald-300 text-xs font-bold">Periode Berakhir</Text>
                <Text className="text-emerald-100/80 text-[11px]">
                  Periode {activePayPeriod.period_name} telah lewat. Buat periode baru untuk pencatatan berjalan?
                </Text>
              </View>
              <Pressable
                className="bg-emerald-500 px-3 py-1.5 rounded-xl"
                onPress={() => router.push('/pay-period/setup')}
              >
                <Text className="text-white text-xs font-bold">Buat Baru</Text>
              </Pressable>
            </View>
          )}

          <View className="bg-black/20 p-4 rounded-2xl border border-white/10 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-primary-200 text-xs font-medium mb-1">
                {t('activePeriod', language)}
              </Text>
              {activePayPeriod ? (
                <>
                  <Text className="text-white font-bold mb-0.5">{activePayPeriod.period_name}</Text>
                  <Text className="text-primary-100 text-xs opacity-80">
                    {format(parseISO(activePayPeriod.start_date), 'dd MMM', { locale: language === 'en' ? localeEn : localeId })} - {format(parseISO(activePayPeriod.end_date), 'dd MMM yyyy', { locale: language === 'en' ? localeEn : localeId })}
                  </Text>
                </>
              ) : (
                <Text className="text-white font-bold">{t('noPeriod', language)}</Text>
              )}
            </View>
            {!activePayPeriod && (
              <Pressable 
                className="bg-primary-500 px-4 py-2 rounded-xl"
                onPress={() => router.push('/pay-period/setup')}
              >
                <Text className="text-white text-xs font-bold">{t('setPeriod', language)}</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
        <View className="flex-row mx-5 gap-4 mb-8">
        <View className="flex-1 bg-dark-card border border-dark-border rounded-3xl p-5 shadow-lg shadow-black/20">
          <View className="w-10 h-10 bg-primary-900/30 rounded-full items-center justify-center mb-3">
            <Ionicons name="time" size={20} color="#60a5fa" />
          </View>
          <Text className="text-dark-muted text-xs font-medium uppercase tracking-wider mb-1">{t('totalHours', language)}</Text>
          <Text className="text-white text-2xl font-bold">
            {language === 'en' ? stats.hoursStr.replace(' jam', 'h').replace(' menit', 'm') : stats.hoursStr.replace(' jam', 'j').replace(' menit', 'm')}
          </Text>
        </View>

        <View className="flex-1 bg-dark-card border border-dark-border rounded-3xl p-5 shadow-lg shadow-black/20">
          <View className="w-10 h-10 bg-secondary-900/30 rounded-full items-center justify-center mb-3">
            <Ionicons name="calendar" size={20} color="#f472b6" />
          </View>
          <Text className="text-dark-muted text-xs font-medium uppercase tracking-wider mb-1">{t('overtimeDays', language)}</Text>
          <Text className="text-white text-2xl font-bold">{stats.days}</Text>
        </View>
        </View>
      </Animated.View>

      {/* Chart Section */}
      <Animated.View entering={FadeInDown.delay(250).duration(600).springify()}>
        <View className="mx-5 mb-8 bg-dark-card border border-dark-border rounded-3xl p-6 shadow-lg shadow-black/20">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-lg font-bold tracking-tight">Tren 7 Hari Terakhir</Text>
            <Ionicons name="bar-chart" size={18} color="#64748b" />
          </View>
          <View className="items-center">
            <BarChart
              data={chartData}
              barWidth={28}
              spacing={16}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
              noOfSections={3}
              maxValue={Math.max(...chartData.map(d => d.value), 4) + 1}
              initialSpacing={0}
              isAnimated
              animationDuration={800}
              xAxisLabelTextStyle={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}
            />
          </View>
          <Pressable 
            className="mt-6 flex-row justify-center items-center py-3 bg-dark-bg/50 rounded-xl border border-dark-border active:bg-dark-border"
            onPress={() => router.push('/analytics/yearly')}
          >
            <Text className="text-primary-400 font-medium text-sm mr-2">Lihat Rekap Tahunan</Text>
            <Ionicons name="arrow-forward" size={14} color="#60a5fa" />
          </Pressable>
        </View>
      </Animated.View>

      {/* Main Action Button */}
      <Animated.View entering={FadeInUp.delay(300).duration(600).springify()}>
        <View className="mx-5 mb-8">
        <Pressable 
          className="bg-primary-600 active:bg-primary-700 flex-row items-center justify-center p-4 rounded-2xl shadow-lg shadow-primary-900/50 border border-primary-500"
          onPress={() => router.push('/(tabs)/add-overtime')}
        >
          <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-lg">{t('addFirstOvertime', language).replace('Pertama ', '')}</Text>
        </Pressable>
        </View>
      </Animated.View>

      {/* Recent Overtime */}
      <Animated.View entering={FadeInUp.delay(400).duration(600).springify()}>
        <View className="mx-5 mb-8">
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-white text-xl font-bold tracking-tight">
            {t('recentOvertime', language)}
          </Text>
          {recentEntries.length > 0 && (
            <Pressable onPress={() => router.push('/(tabs)/calendar')} className="bg-dark-card px-3 py-1.5 rounded-lg border border-dark-border">
              <Text className="text-primary-400 text-xs font-semibold uppercase tracking-wider">{t('seeAll', language)}</Text>
            </Pressable>
          )}
        </View>

        {recentEntries.length === 0 ? (
          <View className="bg-dark-card rounded-3xl p-8 items-center justify-center">
            <Ionicons name="document-text" size={48} color="#475569" style={{ marginBottom: 16 }} />
            <Text className="text-dark-muted text-sm text-center max-w-[200px]">
              {t('noRecentOvertime', language)}
            </Text>
          </View>
        ) : (
          <View className="bg-dark-card rounded-3xl overflow-hidden">
            {recentEntries.map((entry, index) => {
              const mins = calculateOvertimeMinutes(entry.start_time, entry.end_time, entry.break_minutes);
              const isWeekend = new Date(entry.work_date).getDay() === 0 || new Date(entry.work_date).getDay() === 6;
              const isLast = index === recentEntries.length - 1;
              
              return (
                <Animated.View key={entry.id} entering={FadeInUp.delay(500 + (index * 100)).duration(500).springify()} layout={Layout.springify()}>
                  <Pressable
                    className={`px-5 py-4 flex-row justify-between items-center active:bg-dark-border ${!isLast ? 'border-b border-dark-border' : ''}`}
                    onPress={() => router.push(`/overtime/${entry.id}` as any)}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isWeekend ? 'bg-secondary-900/30' : 'bg-primary-900/30'}`}>
                        <Text className={`font-black text-lg ${isWeekend ? 'text-secondary-400' : 'text-primary-400'}`}>
                          {format(parseISO(entry.work_date), 'dd')}
                        </Text>
                        <Text className={`text-[10px] font-bold uppercase ${isWeekend ? 'text-secondary-400/80' : 'text-primary-400/80'}`}>
                          {format(parseISO(entry.work_date), 'MMM', { locale: language === 'en' ? localeEn : localeId })}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-base mb-1">
                          {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                        </Text>
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="cafe" size={12} color="#64748b" />
                          <Text className="text-dark-muted text-xs">
                            Istirahat {entry.break_minutes}m
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end flex-row items-center gap-2">
                      <View className="items-end">
                        <Text className="text-primary-300 font-bold text-base mb-1">+{formatDuration(mins)}</Text>
                        <Text className="text-emerald-400 font-medium text-xs">
                          {formatCurrency(
                            calculateOvertimePay(
                              mins, 
                              activePayPeriod!.formula_type, 
                              employment?.basic_salary || 0, 
                              calculateTotalFixedAllowance(employment?.allowances_detail || null), 
                              activePayPeriod!.flat_rate_amount
                            ).totalPay, 
                            currency
                          )}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#475569" style={{ marginLeft: 8 }} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
