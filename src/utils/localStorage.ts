// localStorage wrapper with error handling for CitiBank CSV Transformer

export interface UserSettings {
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  amountRounding: 'round' | 'truncate';
  errorHandling: 'skip' | 'stop';
  filenameTemplate: string;
  theme: 'light' | 'dark';
  autoDownload: boolean;
  showAdvancedStats: boolean;
}

export interface ProcessingStatistics {
  totalRows: number;
  processedRows: number;
  errorRows: number;
  warningRows: number;
  processingTime: number;
  originalSize: number;
  outputSize: number;
}

export interface ProcessingSession {
  id: string;
  timestamp: Date;
  originalFilename: string;
  outputFilename: string;
  statistics: ProcessingStatistics;
  settings: UserSettings;
  originalFileSize: number;
  outputFileSize: number;
}

// Storage keys
const SETTINGS_KEY = 'citibank-csv-transformer-settings';
const HISTORY_KEY = 'citibank-csv-transformer-history';

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  dateFormat: 'DD/MM/YYYY',
  amountRounding: 'round',
  errorHandling: 'skip',
  filenameTemplate: '{originalName}_sage_{date}',
  theme: 'light',
  autoDownload: false,
  showAdvancedStats: true,
};

// Error handling wrapper
function safeLocalStorage<T>(operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch (error) {
    console.warn('localStorage operation failed:', error);
    return fallback;
  }
}

// User settings storage
export function saveUserSettings(settings: UserSettings): void {
  safeLocalStorage(
    () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)),
    undefined
  );
}

export function getUserSettings(): UserSettings | null {
  return safeLocalStorage(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new settings
    return { ...DEFAULT_SETTINGS, ...parsed };
  }, null);
}

export function clearUserSettings(): void {
  safeLocalStorage(
    () => localStorage.removeItem(SETTINGS_KEY),
    undefined
  );
}

// Processing history storage
export function saveProcessingHistory(session: ProcessingSession): void {
  safeLocalStorage(() => {
    const existing = getProcessingHistory();
    const updated = [session, ...existing].slice(0, 50); // Keep last 50 sessions
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }, undefined);
}

export function getProcessingHistory(): ProcessingSession[] {
  return safeLocalStorage(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Parse dates back from strings
    return parsed.map((session: any) => ({
      ...session,
      timestamp: new Date(session.timestamp),
    }));
  }, []);
}

export function clearProcessingHistory(): void {
  safeLocalStorage(
    () => localStorage.removeItem(HISTORY_KEY),
    undefined
  );
}

export function removeHistoryItem(id: string): void {
  safeLocalStorage(() => {
    const existing = getProcessingHistory();
    const filtered = existing.filter(session => session.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  }, undefined);
}

// Utility functions
export function exportSettings(): string {
  const settings = getUserSettings() || DEFAULT_SETTINGS;
  return JSON.stringify(settings, null, 2);
}

export function importSettings(jsonString: string): boolean {
  try {
    const settings = JSON.parse(jsonString);
    // Validate structure
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    saveUserSettings(merged);
    return true;
  } catch {
    return false;
  }
}

export function getStorageUsage(): { used: number; available: number } {
  return safeLocalStorage(() => {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Approximate localStorage limit is 5-10MB, we'll use 5MB as conservative
    const available = 5 * 1024 * 1024; // 5MB in bytes
    return { used, available };
  }, { used: 0, available: 5 * 1024 * 1024 });
}
