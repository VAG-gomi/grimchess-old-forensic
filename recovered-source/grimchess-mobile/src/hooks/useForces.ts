import { useState, useRef } from 'react';
import type { Forces, MoveClassification } from '../types';

export const INIT_FORCES: Forces = { π: 0.1416, g: 0.8584, f: 0.5, h: 0.3, s: 0.2, e: 0.1, κ: 0.1, o: 0.1 };

const STAGES = [
  [0, 0.283, 'FRAGMENTED'],
  [0.283, 0.425, 'CONTROL'],
  [0.425, 0.566, 'STRUCTURE'],
  [0.566, 0.708, 'PATTERNS'],
  [0.708, 0.850, 'SYSTEMS'],
  [0.850, 0.991, 'DESIGN'],
  [0.991, Infinity, 'CONFIRMED'],
] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function updateForces(f: Forces, classification: MoveClassification['classification']): Forces {
  const n = { ...f };
  switch (classification) {
    case 'brilliant':
      n.π += 0.1416; n.h += 0.05; n.f += 0.05; n.e -= 0.02; break;
    case 'best':
      n.π += 0.1; n.h += 0.03; n.f += 0.03; break;
    case 'good':
      n.π += 0.05; n.f += 0.02; break;
    case 'inaccuracy':
      n.e += 0.02; n.f -= 0.01; break;
    case 'mistake':
      n.π -= 0.05; n.e += 0.05; n.f -= 0.03; break;
    case 'blunder':
      n.π -= 0.1416; n.e += 0.08; n.f -= 0.05; n.h -= 0.03; break;
  }
  n.π = clamp(n.π, 0.1416, 1.0);
  n.g = 1.0 - n.π;
  n.h = clamp(n.h, 0, 1);
  n.e = clamp(n.e, 0, 1);
  n.κ = clamp(n.κ, 0, 1);
  n.o = clamp(n.o, 0, 1);
  n.s = clamp(n.s, 0, 1);
  n.f = clamp(n.f, 0, 1);
  return n;
}

export function getStage(π: number): string {
  for (let i = 0; i < STAGES.length; i++) {
    const [lo, , name] = STAGES[i];
    const nextLo = i < STAGES.length - 1 ? STAGES[i + 1][0] : Infinity;
    if (π >= lo && π < nextLo) return name;
  }
  return 'CONFIRMED';
}

export function useForces(initial: Forces = INIT_FORCES) {
  const [forces, setForces] = useState<Forces>(initial);
  const forcesRef = useRef(forces);
  forcesRef.current = forces;

  const stage = getStage(forces.π);
  const pct = clamp(((forces.π - 0.1416) / (1.0 - 0.1416)) * 100, 0, 100).toFixed(1);

  return { forces, forcesRef, setForces, stage, pct };
}
