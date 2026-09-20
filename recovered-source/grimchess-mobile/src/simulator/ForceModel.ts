import type { ForceState, ForceSnapshot, ClassifiedMove } from './types';

export const INIT_FORCES: ForceState = {
  π: 0.1416, g: 0.8584, f: 0.5, h: 0.3, s: 0.2, e: 0.1, κ: 0.1, o: 0.1,
};

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

export class ForceModel {
  private state: ForceState;
  private history: ForceSnapshot[] = [];

  constructor(initial: ForceState = INIT_FORCES) {
    this.state = { ...initial };
    this.history.push({ t: Date.now(), π: initial.π, h: initial.h, e: initial.e, f: initial.f });
  }

  get forces(): ForceState { return { ...this.state }; }
  get forceHistory(): ForceSnapshot[] { return [...this.history]; }

  clone(): ForceModel {
    return ForceModel.fromJSON({ state: this.state, history: this.history });
  }

  get stage(): string {
    for (let i = 0; i < STAGES.length; i++) {
      const [lo, , name] = STAGES[i];
      const nextLo = i < STAGES.length - 1 ? STAGES[i + 1][0] : Infinity;
      if (this.state.π >= lo && this.state.π < nextLo) return name;
    }
    return 'CONFIRMED';
  }

  get progress(): string {
    const pct = clamp(((this.state.π - 0.1416) / (1.0 - 0.1416)) * 100, 0, 100);
    return pct.toFixed(1);
  }

  apply(classification: ClassifiedMove['classification']): ForceState {
    const n = { ...this.state };
    switch (classification) {
      case 'brilliant': n.π += 0.1416; n.h += 0.05; n.f += 0.05; n.e -= 0.02; break;
      case 'best': n.π += 0.1; n.h += 0.03; n.f += 0.03; break;
      case 'good': n.π += 0.05; n.f += 0.02; break;
      case 'inaccuracy': n.e += 0.02; n.f -= 0.01; break;
      case 'mistake': n.π -= 0.05; n.e += 0.05; n.f -= 0.03; break;
      case 'blunder': n.π -= 0.1416; n.e += 0.08; n.f -= 0.05; n.h -= 0.03; break;
    }
    n.π = clamp(n.π, 0.1416, 1.0);
    n.g = 1.0 - n.π;
    n.h = clamp(n.h, 0, 1);
    n.e = clamp(n.e, 0, 1);
    n.κ = clamp(n.κ, 0, 1);
    n.o = clamp(n.o, 0, 1);
    n.s = clamp(n.s, 0, 1);
    n.f = clamp(n.f, 0, 1);
    this.state = n;
    this.history.push({ t: Date.now(), π: n.π, h: n.h, e: n.e, f: n.f });
    return { ...n };
  }

  // Financial-analysis: Sharpe-like ratio of force improvement consistency
  get sharpeRatio(): number {
    if (this.history.length < 3) return 0;
    const returns = [];
    for (let i = 1; i < this.history.length; i++) {
      returns.push(this.history[i].π - this.history[i - 1].π);
    }
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - avg) ** 2, 0) / returns.length;
    const stdDev = Math.sqrt(variance) || 1;
    return avg / stdDev;
  }

  // Financial-analysis: maximum drawdown (worst consecutive force loss)
  get maxDrawdown(): number {
    let peak = this.history[0]?.π ?? 0;
    let maxDD = 0;
    for (const snap of this.history) {
      if (snap.π > peak) peak = snap.π;
      const dd = peak - snap.π;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  // Financial-analysis: volatility (standard deviation of π)
  get volatility(): number {
    if (this.history.length < 2) return 0;
    const values = this.history.map((h) => h.π);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  toJSON(): object {
    return { state: this.state, history: this.history };
  }

  static fromJSON(data: { state: ForceState; history: ForceSnapshot[] }): ForceModel {
    const model = new ForceModel(data.state);
    if (data.history.length > 0) model.history = [...data.history];
    return model;
  }
}
