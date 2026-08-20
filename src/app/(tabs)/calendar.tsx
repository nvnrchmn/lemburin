import { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

import { useDataStore } from '@/stores/data-store';
import { formatDuration } from '@/utils/formatting';
import { calculateOvertimeMinutes } from '@/utils/calculator';
import { supabase } from '@/lib/supabase';
import type { OvertimeEntry } from '@/types/database';
import { checkIsHoliday } from '@/utils/holidays';

// Setup Indonesian locale for calendar
LocaleConfig.locales['id'] = {
  monthNames: [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ],
  monthNamesShort: [
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
  ],
  dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  today: 'Hari ini',
};
LocaleConfig.defaultLocale = 'id';

export default function CalendarScreen() {
  const { employment, overtimeEntries } = useDataStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [allCalendarEntries, setAllCalendarEntries] = useState<OvertimeEntry[]>([]);

  useEffect(() => {
    async function loadAllEntries() {
      if (!employment?.id) return;
      try {
        const { data: pList } = await supabase
          .from('pay_periods')
          .select('id')
          .eq('employment_id', employment.id);

        if (pList && pList.length > 0) {
          const pIds = pList.map(p => p.id);
          const { data: entries } = await supabase
            .from('overtime_entries')
            .select('*')
            .in('pay_period_id', pIds);
          if (entries) setAllCalendarEntries(entries as OvertimeEntry[]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAllEntries();
  }, [employment?.id, overtimeEntries]);

  const displayedEntries = allCalendarEntries.length > 0 ? allCalendarEntries : overtimeEntries;

  // Mark dates with overtime
  const markedDates = useMemo(() => {
    const marks: any = {};
    displayedEntries.forEach(entry => {
      marks[entry.work_date] = { marked: true, dotColor: '#3b82f6' };
    });

    // Highlight selected date
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#1e3a8a' };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: '#2E3135' };
    }

    return marks;
  }, [displayedEntries, selectedDate]);

  // Entries for selected date
  const selectedEntries = useMemo(() => {
    return displayedEntries.filter(e => e.work_date === selectedDate);
  }, [displayedEntries, selectedDate]);

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg pt-12">
      <View className="px-5 mb-4">
        <Text className="text-light-text dark:text-dark-text text-2xl font-bold">
          Kalender Lembur
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(600).springify()}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#0F172A',
            calendarBackground: '#0F172A',
            textSectionTitleColor: '#64748b',
            selectedDayBackgroundColor: '#3b82f6',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#60a5fa',
            dayTextColor: '#F8FAFC',
            textDisabledColor: '#334155',
            dotColor: '#3b82f6',
            selectedDotColor: '#ffffff',
            arrowColor: '#F8FAFC',
            monthTextColor: '#F8FAFC',
            textDayFontFamily: 'PlusJakartaSans-Medium',
            textMonthFontFamily: 'PlusJakartaSans-Bold',
            textDayHeaderFontFamily: 'PlusJakartaSans-Regular',
            textMonthFontWeight: 'bold',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 13,
          }}
        />
      </Animated.View>

      <ScrollView className="flex-1 px-5 pt-6 bg-light-bg dark:bg-dark-bg">
        <View className="mb-4">
          <Text className="text-light-text dark:text-dark-text text-lg font-bold">
            {format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy', { locale: id })}
          </Text>
          {(() => {
            const hol = checkIsHoliday(selectedDate, employment?.work_system || '5_days');
            if (hol.holidayName) {
              return (
                <View className="mt-1 self-start bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full flex-row items-center">
                  <Text className="text-red-400 text-xs font-bold">🔴 {hol.holidayName}</Text>
                </View>
              );
            }
            return null;
          })()}
        </View>

        {selectedEntries.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200).duration(500).springify()}>
            <View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-8 items-center mt-4">
              <Text className="text-light-muted dark:text-dark-muted text-center mb-2">
                Tidak ada catatan lembur pada tanggal ini.
              </Text>
              <Pressable
                className="mt-4 px-6 py-3 bg-primary-950/30 rounded-2xl border border-primary-500/30 active:bg-primary-900/50"
                onPress={() => router.push('/(tabs)/add-overtime')}
              >
                <Text className="text-primary-400 font-bold">Tambah Lembur</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <View className="space-y-3 mt-4">
            {selectedEntries.map((entry, index) => {
              const mins = calculateOvertimeMinutes(
                entry.start_time,
                entry.end_time,
                entry.break_minutes,
              );

              return (
                <Animated.View
                  key={entry.id}
                  entering={FadeInUp.delay(100 + index * 100)
                    .duration(500)
                    .springify()}
                  layout={Layout.springify()}
                >
                  <Pressable
                    className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-5 flex-row justify-between items-center active:border-primary-500/50"
                    onPress={() => router.push(`/overtime/${entry.id}` as any)}
                  >
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white font-bold text-base">
                          {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                        </Text>
                        {entry.is_holiday && (
                          <View className="bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
                            <Text className="text-red-400 text-[10px] font-bold">Libur</Text>
                          </View>
                        )}
                      </View>
                      {entry.notes && (
                        <Text className="text-light-muted dark:text-dark-muted text-xs mt-1">
                          {entry.notes}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-primary-400 font-bold text-base">
                        +{formatDuration(mins)}
                      </Text>
                      {entry.break_minutes > 0 && (
                        <Text className="text-light-muted dark:text-dark-muted text-xs mt-1">
                          Istirahat {entry.break_minutes}m
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
