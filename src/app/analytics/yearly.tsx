import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { calculateDuration } from '@/utils/calculator';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export default function YearlyAnalyticsScreen() {
  const { employment } = useDataStore();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function fetchYearlyData() {
      if (!employment?.id) return;

      try {
        const { data, error } = await supabase
          .from('overtime_entries')
          .select(
            'work_date, start_time, end_time, break_minutes, pay_periods!inner(employment_id)',
          )
          .eq('pay_periods.employment_id', employment.id)
          .gte('work_date', `${currentYear}-01-01`)
          .lte('work_date', `${currentYear}-12-31`);

        if (error) throw error;

        const monthTotals = Array(12).fill(0);

        (
          data as
            | { work_date: string; start_time: string; end_time: string; break_minutes: number }[]
            | null
        )?.forEach(entry => {
          const date = new Date(entry.work_date);
          const monthIndex = date.getMonth(); // 0-11
          const hours = calculateDuration(entry.start_time, entry.end_time, entry.break_minutes);
          monthTotals[monthIndex] += hours;
        });

        setMonthlyData(monthTotals);
      } catch (error) {
        console.error('Error fetching yearly data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchYearlyData();
  }, [employment?.id, currentYear]);

  const chartData = useMemo(() => {
    return monthlyData.map((value, index) => ({
      value: Number(value.toFixed(1)),
      label: MONTH_LABELS[index],
      labelTextStyle: { color: '#64748b', fontSize: 10 },
      dataPointText: value > 0 ? value.toFixed(1) : '',
    }));
  }, [monthlyData]);

  const totalYearlyHours = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr, 0);
  }, [monthlyData]);

  const maxMonthHours = useMemo(() => {
    return Math.max(...monthlyData);
  }, [monthlyData]);

  return (
    <ScrollView
      className="flex-1 bg-light-bg dark:bg-dark-bg px-5 pt-6"
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-8">
        <Text className="text-light-muted dark:text-dark-muted font-medium text-sm uppercase tracking-wider mb-1">
          Laporan Tahunan
        </Text>
        <Text className="text-white text-3xl font-bold tracking-tight">Analitik {currentYear}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator color="#3b82f6" size="large" />
        </View>
      ) : (
        <Animated.View
          entering={FadeInUp.delay(200).duration(500).springify()}
          layout={Layout.springify()}
        >
          {/* Summary Cards */}
          <View className="flex-row gap-4 mb-8">
            <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-5 shadow-lg shadow-black/20">
              <View className="w-10 h-10 bg-primary-900/30 rounded-full items-center justify-center mb-3">
                <Ionicons name="time" size={20} color="#60a5fa" />
              </View>
              <Text className="text-light-muted dark:text-dark-muted text-xs font-medium uppercase tracking-wider mb-1">
                Total Jam
              </Text>
              <Text className="text-white text-2xl font-bold">{totalYearlyHours.toFixed(1)}h</Text>
            </View>
            <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-5 shadow-lg shadow-black/20">
              <View className="w-10 h-10 bg-emerald-900/30 rounded-full items-center justify-center mb-3">
                <Ionicons name="stats-chart" size={20} color="#34d399" />
              </View>
              <Text className="text-light-muted dark:text-dark-muted text-xs font-medium uppercase tracking-wider mb-1">
                Bulan Tersibuk
              </Text>
              <Text className="text-white text-2xl font-bold">
                {MONTH_LABELS[monthlyData.indexOf(maxMonthHours)]}
              </Text>
            </View>
          </View>

          {/* Chart Section */}
          <View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-5 pb-8 shadow-lg shadow-black/20 mb-8">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-lg font-bold tracking-tight">Tren Jam Lembur</Text>
              <Ionicons name="analytics" size={20} color="#64748b" />
            </View>

            <View className="items-center -ml-4">
              <LineChart
                data={chartData}
                height={200}
                width={width - 100}
                spacing={(width - 110) / 11}
                color="#3b82f6"
                thickness={3}
                startFillColor="rgba(59, 130, 246, 0.3)"
                endFillColor="rgba(59, 130, 246, 0.01)"
                startOpacity={0.9}
                endOpacity={0.2}
                initialSpacing={10}
                noOfSections={4}
                maxValue={Math.max(10, Math.ceil(maxMonthHours * 1.2))}
                yAxisColor="#334155"
                yAxisThickness={1}
                rulesType="solid"
                rulesColor="#1e293b"
                yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
                xAxisColor="#334155"
                pointerConfig={{
                  pointerStripColor: 'lightgray',
                  pointerStripWidth: 2,
                  pointerColor: 'lightgray',
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  activatePointersOnLongPress: true,
                  autoAdjustPointerLabelPosition: true,
                }}
                dataPointsColor="#60a5fa"
                dataPointsRadius={4}
                textShiftY={-10}
                textShiftX={-5}
                textFontSize={10}
                textColor="#94a3b8"
                isAnimated
              />
            </View>
          </View>

          <View className="bg-blue-500/10 rounded-2xl p-5 mb-12 flex-row items-start border border-blue-500/20">
            <Ionicons
              name="information-circle"
              size={24}
              color="#60a5fa"
              style={{ marginRight: 12, marginTop: -2 }}
            />
            <Text className="flex-1 text-blue-200/80 leading-relaxed text-sm">
              Grafik ini merekap seluruh jam lembur yang pernah Anda catat sepanjang tahun{' '}
              {currentYear}. Gunakan informasi ini untuk memantau beban kerja dan kesehatan kerja
              Anda.
            </Text>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}
