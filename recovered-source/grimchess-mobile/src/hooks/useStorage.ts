import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import type { SessionData, ForceSnapshot } from '../types';

const SESSION_KEY = 'grimchess_session_v1';
const HISTORY_KEY = 'grimchess_history_v1';

export function useStorage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const loadSession = useCallback(async (): Promise<SessionData | null> => {
    try {
      const { value } = await Preferences.get({ key: SESSION_KEY });
      return value ? JSON.parse(value) : null;
    } catch { return null; }
  }, []);

  const saveSession = useCallback(async (data: SessionData): Promise<void> => {
    try {
      await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(data) });
    } catch { /* quota */ }
  }, []);

  const loadHistory = useCallback(async (): Promise<ForceSnapshot[]> => {
    try {
      const { value } = await Preferences.get({ key: HISTORY_KEY });
      return value ? JSON.parse(value) : [];
    } catch { return []; }
  }, []);

  const saveHistory = useCallback(async (history: ForceSnapshot[]): Promise<void> => {
    try {
      await Preferences.set({ key: HISTORY_KEY, value: JSON.stringify(history.slice(-300)) });
    } catch { /* quota */ }
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    await Preferences.remove({ key: SESSION_KEY });
    await Preferences.remove({ key: HISTORY_KEY });
  }, []);

  return { isReady, loadSession, saveSession, loadHistory, saveHistory, clearAll };
}
