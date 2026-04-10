import { create } from 'zustand';
import type { UserSettings } from '../types';

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  toggleTheme: () => void;
  getTheme: () => 'light' | 'dark';
}

const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'es',
  fontSize: 16,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: (() => {
    const saved = localStorage.getItem('quicknotes_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  })(),

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      localStorage.setItem('quicknotes_settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme: 'light' | 'dark' = state.settings.theme === 'dark' ? 'light' : 'dark';
      const newSettings = { ...state.settings, theme: nextTheme };
      localStorage.setItem('quicknotes_settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },

  getTheme: () => {
    const theme = get().settings.theme;
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  },
}));
