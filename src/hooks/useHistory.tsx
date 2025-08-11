import { useState, useEffect, useCallback } from 'react';
import {
  type ProcessingSession,
  type ProcessingStatistics,
  type UserSettings,
  saveProcessingHistory,
  getProcessingHistory,
  clearProcessingHistory,
  removeHistoryItem,
} from '@/utils/localStorage';

export function useHistory() {
  const [history, setHistory] = useState<ProcessingSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history on mount
  useEffect(() => {
    const loadHistory = () => {
      const stored = getProcessingHistory();
      setHistory(stored);
      setIsLoaded(true);
    };

    loadHistory();
  }, []);

  const addSession = useCallback((
    originalFilename: string,
    outputFilename: string,
    statistics: ProcessingStatistics,
    settings: UserSettings,
    originalFileSize: number,
    outputFileSize: number
  ) => {
    const session: ProcessingSession = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      originalFilename,
      outputFilename,
      statistics,
      settings,
      originalFileSize,
      outputFileSize,
    };

    // Save to localStorage
    saveProcessingHistory(session);

    // Update state
    setHistory(prev => [session, ...prev.slice(0, 49)]); // Keep last 50
  }, []);

  const removeSession = useCallback((id: string) => {
    removeHistoryItem(id);
    setHistory(prev => prev.filter(session => session.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    clearProcessingHistory();
    setHistory([]);
  }, []);

  const getSessionById = useCallback((id: string): ProcessingSession | undefined => {
    return history.find(session => session.id === id);
  }, [history]);

  // Get statistics about history
  const getHistoryStats = useCallback(() => {
    if (history.length === 0) {
      return {
        totalSessions: 0,
        totalFilesProcessed: 0,
        totalRowsProcessed: 0,
        averageProcessingTime: 0,
        totalErrors: 0,
        totalWarnings: 0,
      };
    }

    const stats = history.reduce((acc, session) => ({
      totalSessions: acc.totalSessions + 1,
      totalFilesProcessed: acc.totalFilesProcessed + 1,
      totalRowsProcessed: acc.totalRowsProcessed + session.statistics.processedRows,
      totalProcessingTime: acc.totalProcessingTime + session.statistics.processingTime,
      totalErrors: acc.totalErrors + session.statistics.errorRows,
      totalWarnings: acc.totalWarnings + session.statistics.warningRows,
    }), {
      totalSessions: 0,
      totalFilesProcessed: 0,
      totalRowsProcessed: 0,
      totalProcessingTime: 0,
      totalErrors: 0,
      totalWarnings: 0,
    });

    return {
      ...stats,
      averageProcessingTime: stats.totalProcessingTime / stats.totalSessions,
    };
  }, [history]);

  // Get recent sessions (last 10)
  const getRecentSessions = useCallback((limit: number = 10): ProcessingSession[] => {
    return history.slice(0, limit);
  }, [history]);

  // Search sessions
  const searchSessions = useCallback((query: string): ProcessingSession[] => {
    if (!query.trim()) return history;

    const lowercaseQuery = query.toLowerCase();
    return history.filter(session =>
      session.originalFilename.toLowerCase().includes(lowercaseQuery) ||
      session.outputFilename.toLowerCase().includes(lowercaseQuery)
    );
  }, [history]);

  // Filter sessions by date range
  const getSessionsByDateRange = useCallback((
    startDate: Date,
    endDate: Date
  ): ProcessingSession[] => {
    return history.filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }, [history]);

  return {
    history,
    addSession,
    removeSession,
    clearHistory,
    getSessionById,
    getHistoryStats,
    getRecentSessions,
    searchSessions,
    getSessionsByDateRange,
    isLoaded,
  };
}
