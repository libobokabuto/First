import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
}

interface SettingsStore extends AppSettings {
  setTheme: (theme: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'docket-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
