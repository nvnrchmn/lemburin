import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { router } from 'expo-router';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { employment } = useDataStore();
  const [history, setHistory] = useState<PayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!employment?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('pay_periods')
          .select('*')
          .eq('employment_id', employment.id)
          .order('start_date', { ascending: false });
          
        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchHistory();
  }, [employment?.id]);

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      <View className="px-5 pt-12 pb-6">
        <Text className="text-white text-3xl font-sans-extrabold mb-1">Riwayat Periode</Text>
        <Text className="text-dark-muted font-medium text-sm mb-6">
          Seluruh periode gaji yang pernah dicatat
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#3b82f6" size="large" className="mt-10" />
        ) : history.length === 0 ? (
          <View className="bg-dark-card border border-dark-border rounded-xl p-8 items-center mt-2 border-dashed">
            <Ionicons name="document-text" size={48} color="#475569" style={{ marginBottom: 12 }} />
            <Text className="text-dark-text text-base font-semibold mb-1">
              Belum Ada Riwayat
            </Text>
            <Text className="text-dark-muted text-sm text-center">
              Riwayat periode gaji akan muncul di sini setelah Anda mulai mencatat
              lembur.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {history.map((period, index) => (
              <Animated.View key={period.id} entering={FadeInUp.delay(100 + (index * 100)).duration(500).springify()} layout={Layout.springify()}>
                <Pressable 
                  className="bg-dark-card border border-dark-border rounded-3xl p-6 active:border-primary-500/50 shadow-sm"
                  onPress={() => router.push(`/summary/${period.id}` as any)}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <Text className="text-white text-xl font-sans-bold">
                      {period.period_name}
                    </Text>
                    {period.is_locked ? (
                      <View className="bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <Text className="text-emerald-400 font-sans-bold text-xs uppercase tracking-wider">Selesai</Text>
                      </View>
                    ) : (
                      <View className="bg-primary-500/10 px-3 py-1.5 rounded-full border border-primary-500/20">
                        <Text className="text-primary-400 font-sans-bold text-xs uppercase tracking-wider">Aktif</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center mb-4">
                    <Ionicons name="calendar" size={14} color="#64748b" style={{ marginRight: 6 }} />
                    <Text className="text-dark-muted font-medium text-sm">
                      {format(parseISO(period.start_date), 'dd MMM yyyy', { locale: id })} - {format(parseISO(period.end_date), 'dd MMM yyyy', { locale: id })}
                    </Text>
                  </View>
                  <View className="mt-2 flex-row justify-between border-t border-dark-border pt-4">
                    <Text className="text-dark-muted font-medium text-sm">Formula: {period.formula_type === 'indonesia' ? 'Depnaker' : 'Flat Rate'}</Text>
                    <View className="flex-row items-center">
                      <Text className="text-primary-400 font-sans-bold text-sm mr-1">Lihat Detail</Text>
                      <Ionicons name="arrow-forward" size={14} color="#60a5fa" />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
