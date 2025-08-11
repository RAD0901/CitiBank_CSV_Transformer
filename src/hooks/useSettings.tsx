import { useState, useEffect, useCallback } from 'react';
import {
  type UserSettings,
  DEFAULT_SETTINGS,
  saveUserSettings,
  getUserSettings,
  clearUserSettings,
  exportSettings,
  importSettings,
} from '@/utils/localStorage';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = () => {
      const stored = getUserSettings();
      if (stored) {
        setSettings(stored);
      }
      setIsLoaded(true);
    };

    loadSettings();
  }, []);

  // Save settings when they change (debounced)
  useEffect(() => {
    if (!isLoaded || !isDirty) return;

    const timeout = setTimeout(() => {
      saveUserSettings(settings);
      setIsDirty(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [settings, isLoaded, isDirty]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    updateSettings({ [key]: value });
  }, [updateSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    clearUserSettings();
    setIsDirty(false);
  }, []);

  const exportUserSettings = useCallback(() => {
    return exportSettings();
  }, []);

  const importUserSettings = useCallback((jsonString: string): boolean => {
    const success = importSettings(jsonString);
    if (success) {
      const imported = getUserSettings();
      if (imported) {
        setSettings(imported);
        setIsDirty(false);
      }
    }
    return success;
  }, []);

  // Generate filename using template
  const generateFilename = useCallback((originalName: string): string => {
    const template = settings.filenameTemplate;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
    
    return template
      .replace('{originalName}', baseName)
      .replace('{date}', dateStr)
      .replace('{time}', timeStr)
      .replace('{datetime}', `${dateStr}_${timeStr}`)
      + '.csv';
  }, [settings.filenameTemplate]);

  return {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    generateFilename,
    exportSettings: exportUserSettings,
    importSettings: importUserSettings,
    isLoaded,
    isDirty,
  };
}
