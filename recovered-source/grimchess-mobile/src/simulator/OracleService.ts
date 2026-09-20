import type { Forces, MoveClassification } from '../types';

const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
const API_BASE = env?.VITE_API_URL?.trim() || '';

interface QueuedMessage {
  fen: string;
  moveHistory: string;
  playerMove: string;
  engineMove: string;
  classification: MoveClassification;
  forces: Forces;
  stage: string;
  bodyType: string | null;
}

export class OracleService {
  private abortCtrl: AbortController | null = null;
  private offlineQueue: QueuedMessage[] = [];
  private isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; this.flushQueue(); });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  async speak(
    fen: string,
    moveHistory: string,
    playerMove: string,
    engineMove: string,
    classification: MoveClassification,
    forces: Forces,
    stage: string,
    bodyType: string | null
  ): Promise<string> {
    if (!API_BASE) {
      return 'Offline mode: the local chess engine has completed the bot move.';
    }
    if (!this.isOnline) {
      this.offlineQueue.push({ fen, moveHistory, playerMove, engineMove, classification, forces, stage, bodyType });
      return '[Offline — Oracle will speak when connection restored]';
    }

    this.abortCtrl?.abort();
    this.abortCtrl = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/api/chess/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, moveHistory, playerMove, engineMove, classification, forces, stage, bodyType }),
        signal: this.abortCtrl.signal,
      });

      if (!res.ok) {
        let errText = `HTTP ${res.status}`;
        try { const d = await res.json(); if (d.error) errText = d.error; } catch { /* ignore */ }
        throw new Error(errText);
      }

      const data = await res.json();
      return data.reply || '';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return '';
      throw err;
    }
  }

  private async flushQueue(): Promise<void> {
    while (this.offlineQueue.length > 0 && this.isOnline) {
      const msg = this.offlineQueue.shift()!;
      try {
        await this.speak(msg.fen, msg.moveHistory, msg.playerMove, msg.engineMove, msg.classification, msg.forces, msg.stage, msg.bodyType);
      } catch {
        this.offlineQueue.unshift(msg);
        break;
      }
    }
  }

  cleanup(): void {
    this.abortCtrl?.abort();
    this.abortCtrl = null;
  }
}
