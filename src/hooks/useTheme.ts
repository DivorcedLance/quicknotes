import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export const useTheme = () => {
  const { settings, toggleTheme, getTheme } = useSettingsStore();

  useEffect(() => {
    const currentTheme = getTheme();
    const htmlElement = document.documentElement;

    if (currentTheme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [settings.theme]);

  return { toggleTheme, getTheme, theme: settings.theme };
};
