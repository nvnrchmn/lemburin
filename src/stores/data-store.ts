import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile, Employment, PayPeriod, OvertimeEntry } from '@/types/database';
import { secureStorage } from '@/lib/secure-storage';
import { Platform } from 'react-native';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface DataState {
  profile: Profile | null;
  employment: Employment | null;
  activePayPeriod: PayPeriod | null;
  overtimeEntries: OvertimeEntry[];

  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  isOffline: boolean;

  setProfile: (profile: Profile | null) => void;
  setEmployment: (employment: Employment | null) => void;
  setActivePayPeriod: (period: PayPeriod | null) => void;
  setOvertimeEntries: (entries: OvertimeEntry[]) => void;
  setIsSyncing: (value: boolean) => void;
  setSyncState: (
    state: Partial<Pick<DataState, 'syncStatus' | 'lastSyncedAt' | 'syncError' | 'isOffline'>>,
  ) => void;
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
      syncStatus: 'idle',
      lastSyncedAt: null,
      syncError: null,
      isOffline: false,

      setProfile: profile => set({ profile }),
      setEmployment: employment => set({ employment }),
      setActivePayPeriod: activePayPeriod => set({ activePayPeriod }),
      setOvertimeEntries: overtimeEntries => set({ overtimeEntries }),
      setIsSyncing: value => set({ isSyncing: value }),
      setSyncState: state => set(state),

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
          isSyncing: false,
          syncStatus: 'idle',
          lastSyncedAt: null,
          syncError: null,
          isOffline: false,
        }),
    }),
    {
      name: 'lemburin-data-store',
      storage: createJSONStorage(() => secureStorage),
      partialize: state => ({
        profile: state.profile,
        employment: state.employment,
        activePayPeriod: state.activePayPeriod,
        overtimeEntries: state.overtimeEntries,
      }),
    },
  ),
);

// Initialize network listener
let unsubscribeNetInfo: (() => void) | null = null;

export function initNetworkListener() {
  if (Platform.OS === 'web') return;
  if (unsubscribeNetInfo) return;
  import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
    unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable);
      useDataStore.getState().setSyncState({ isOffline: offline });
      if (offline) {
        useDataStore.getState().setSyncState({ syncStatus: 'offline' });
      }
    });
  });
}

export function stopNetworkListener() {
  unsubscribeNetInfo?.();
  unsubscribeNetInfo = null;
}

export type { DataState };
