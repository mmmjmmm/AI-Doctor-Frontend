import { create } from 'zustand';
import type { AppConfig } from '@/api/app';

interface AppState {
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
