import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentFile {
  uri: string;
  name: string;
  lastOpened: number;
}

interface FileStore {
  recentFiles: RecentFile[];
  addRecentFile: (file: Omit<RecentFile, 'lastOpened'>) => void;
  removeRecentFile: (uri: string) => void;
}

export const useFileStore = create<FileStore>()(
  persist(
    (set) => ({
      recentFiles: [],

      addRecentFile: (file) =>
        set((state) => {
          const filtered = state.recentFiles.filter((f) => f.uri !== file.uri);
          return {
            recentFiles: [
              { ...file, lastOpened: Date.now() },
              ...filtered,
            ].slice(0, 50),
          };
        }),

      removeRecentFile: (uri) =>
        set((state) => ({
          recentFiles: state.recentFiles.filter((f) => f.uri !== uri),
        })),
    }),
    {
      name: 'docket-recent-files',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
