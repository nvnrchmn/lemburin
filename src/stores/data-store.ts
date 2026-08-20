import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile, Employment, PayPeriod, OvertimeEntry } from '@/types/database';
import { secureStorage } from '@/lib/secure-storage';

interface DataState {
  profile: Profile | null;
  employment: Employment | null;
  activePayPeriod: PayPeriod | null;
  overtimeEntries: OvertimeEntry[];

  isSyncing: boolean;

  setProfile: (profile: Profile | null) => void;
  setEmployment: (employment: Employment | null) => void;
  setActivePayPeriod: (period: PayPeriod | null) => void;
  setOvertimeEntries: (entries: OvertimeEntry[]) => void;
  setIsSyncing: (value: boolean) => void;
  addOvertimeEntry: (entry: OvertimeEntry) => void;
  updateOvertimeEntry: (entry: OvertimeEntry) => void;
  removeOvertimeEntry: (id: string) => void;

  clearData: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    set => ({
      profile: null,
      employment: null,
      activePayPeriod: null,
      overtimeEntries: [],
      isSyncing: false,

      setProfile: profile => set({ profile }),
      setEmployment: employment => set({ employment }),
      setActivePayPeriod: activePayPeriod => set({ activePayPeriod }),
      setOvertimeEntries: overtimeEntries => set({ overtimeEntries }),
      setIsSyncing: value => set({ isSyncing: value }),

      addOvertimeEntry: entry =>
        set(state => ({
          overtimeEntries: [...state.overtimeEntries, entry],
        })),

      updateOvertimeEntry: entry =>
        set(state => ({
          overtimeEntries: state.overtimeEntries.map(e => (e.id === entry.id ? entry : e)),
        })),

      removeOvertimeEntry: id =>
        set(state => ({
          overtimeEntries: state.overtimeEntries.filter(e => e.id !== id),
        })),

      clearData: () =>
        set({
          profile: null,
          employment: null,
          activePayPeriod: null,
          overtimeEntries: [],
        }),
    }),
    {
      name: 'lemburin-data-store',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
