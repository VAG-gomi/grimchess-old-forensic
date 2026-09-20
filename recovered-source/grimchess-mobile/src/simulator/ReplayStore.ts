import { Preferences } from '@capacitor/preferences';
import type { SessionData, ForceSnapshot } from '../types';

const SESSION_KEY = 'grimchess_session_v2';
const HISTORY_KEY = 'grimchess_history_v2';
const SCHEMA_VERSION = 3;

interface StoredSession extends SessionData {
  _schema: number;
  _savedAt: number;
}

export class ReplayStore {
  async loadSession(): Promise<SessionData | null> {
    try {
      const { value } = await Preferences.get({ key: SESSION_KEY });
      if (!value) return null;
      const parsed = JSON.parse(value) as StoredSession;
      if (parsed._schema !== SCHEMA_VERSION) {
        // Migration could happen here
        return null;
      }
      return parsed;
    } catch { return null; }
  }

  async saveSession(data: SessionData): Promise<void> {
    try {
      const stored: StoredSession = {
        ...data,
        _schema: SCHEMA_VERSION,
        _savedAt: Date.now(),
      };
      await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(stored) });
    } catch { /* quota */ }
  }

  async loadHistory(): Promise<ForceSnapshot[]> {
    try {
      const { value } = await Preferences.get({ key: HISTORY_KEY });
      return value ? JSON.parse(value) : [];
    } catch { return []; }
  }

  async saveHistory(history: ForceSnapshot[]): Promise<void> {
    try {
      await Preferences.set({ key: HISTORY_KEY, value: JSON.stringify(history.slice(-300)) });
    } catch { /* quota */ }
  }

  async clearAll(): Promise<void> {
    await Preferences.remove({ key: SESSION_KEY });
    await Preferences.remove({ key: HISTORY_KEY });
  }
}
