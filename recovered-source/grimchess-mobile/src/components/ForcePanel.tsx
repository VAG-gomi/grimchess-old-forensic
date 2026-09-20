import Sparkline from './Sparkline';
import type { Forces, MoveClassification, ForceSnapshot } from '../types';

const FORCE_LABELS: (keyof Forces)[] = ['π', 'g', 'f', 'h', 's', 'e', 'κ', 'o'];
const FORCE_NAMES: Record<string, string> = {
  π: 'Mastery', g: 'Gap', f: 'Flow', h: 'Honesty',
  s: 'Self-recursion', e: 'Error', κ: 'Coupling', o: 'Observer',
};
const FORCE_COLOR: Record<string, string> = {
  π: '#a78bfa', g: '#6b7280', f: '#34d399', h: '#60a5fa',
  s: '#f59e0b', e: '#f87171', κ: '#e879f9', o: '#38bdf8',
};
const CLASS_COLORS: Record<string, string> = {
  brilliant: '#fbbf24', best: '#34d399', good: '#60a5fa',
  inaccuracy: '#94a3b8', mistake: '#f59e0b', blunder: '#f87171',
};

const r = (v: number) => Math.round(v * 10000) / 10000;

interface ForcePanelProps {
  forces: Forces;
  forceHistory: ForceSnapshot[];
  lastClass: MoveClassification | null;
  stage: string;
  bodyType: string | null;
  difficultyLabel: string;
  gameOver: boolean;
  gameOverText: string;
}

export default function ForcePanel({
  forces, forceHistory, lastClass, stage, bodyType,
  difficultyLabel, gameOver, gameOverText,
}: ForcePanelProps) {
  const πHistory = forceHistory.map((h) => h.π);

  return (
    <div style={{
      width: 200, background: '#0f0f1a', borderLeft: '1px solid #1e1e3a',
      padding: '1rem 0.75rem', overflowY: 'auto', flexShrink: 0,
    }}>
      <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
        SEVEN FORCES
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', marginBottom: '0.25rem', letterSpacing: '0.1em' }}>
          π TRAJECTORY
        </div>
        <Sparkline data={πHistory} color={FORCE_COLOR.π} />
      </div>

      {FORCE_LABELS.map((k) => (
        <div key={k} style={{ marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
            <span style={{ color: FORCE_COLOR[k] }}>
              {k} <span style={{ color: '#475569' }}>{FORCE_NAMES[k]}</span>
            </span>
            <span style={{ color: '#94a3b8' }}>{r(forces[k])}</span>
          </div>
          <div style={{ background: '#1e1e2e', height: 3, borderRadius: 2 }}>
            <div style={{
              width: `${Math.min(100, forces[k] * 100)}%`,
              height: '100%', background: FORCE_COLOR[k], borderRadius: 2, transition: 'width 0.4s',
            }} />
          </div>
        </div>
      ))}

      {lastClass && (
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e1e3a' }}>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
            LAST READ
          </div>
          <div style={{
            fontSize: '0.65rem', color: CLASS_COLORS[lastClass.classification] || '#64748b',
            fontWeight: 'bold', textTransform: 'uppercase',
          }}>
            {lastClass.classification}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: '0.2rem' }}>
            Δ {r(lastClass.delta)} | best: {lastClass.bestMove}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e1e3a' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>STAGE</div>
        <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>{stage}</div>
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e1e3a' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>BOT</div>
        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{difficultyLabel}</div>
      </div>

      {bodyType && (
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e1e3a' }}>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>BODY</div>
          <div style={{ fontSize: '0.65rem', color: '#f59e0b' }}>{bodyType}</div>
        </div>
      )}

      {gameOver && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#2a0a0a', border: '1px solid #7f1d1d', borderRadius: 4 }}>
          <div style={{ fontSize: '0.65rem', color: '#fca5a5', textAlign: 'center' }}>{gameOverText}</div>
        </div>
      )}
    </div>
  );
}
