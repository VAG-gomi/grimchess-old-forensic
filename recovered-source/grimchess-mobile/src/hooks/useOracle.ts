import { useCallback, useRef } from 'react';
import type { Forces, MoveClassification } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function callAPI(endpoint: string, payload: unknown, signal?: AbortSignal): Promise<any> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    let errText = `HTTP ${res.status}`;
    try { const d = await res.json(); if (d.error) errText = d.error; } catch { /* ignore */ }
    throw new Error(errText);
  }
  return res.json();
}

export function useOracle() {
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (
    fen: string,
    moveHistory: string,
    playerMove: string,
    engineMove: string,
    classification: MoveClassification,
    forces: Forces,
    stage: string,
    bodyType: string | null
  ): Promise<string> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const data = await callAPI('/api/chess/speak', {
        fen, moveHistory, playerMove, engineMove,
        classification, forces, stage, bodyType,
      }, ctrl.signal);
      return data.reply || '';
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { speak, cleanup };
}
