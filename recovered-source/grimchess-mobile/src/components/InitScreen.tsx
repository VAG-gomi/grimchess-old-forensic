import { useState } from 'react';
import type { DifficultyLevel } from '../types';

const DIFFICULTY: DifficultyLevel[] = [
  { name: 'BEGINNER', depth: 5, noise: 0.35, label: '1 — BEGINNER' },
  { name: 'EASY', depth: 8, noise: 0.25, label: '2 — EASY' },
  { name: 'INTERMEDIATE', depth: 12, noise: 0.15, label: '3 — INTERMEDIATE' },
  { name: 'ADVANCED', depth: 15, noise: 0.08, label: '4 — ADVANCED' },
  { name: 'EXPERT', depth: 18, noise: 0.03, label: '5 — EXPERT' },
  { name: 'MASTER', depth: 20, noise: 0.0, label: '6 — MASTER' },
  { name: 'MAXIMUM', depth: 22, noise: 0.0, label: '7 — MAXIMUM' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1e1e2e', border: '1px solid #334155', borderRadius: 4,
  padding: '0.5rem 0.75rem', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem',
  boxSizing: 'border-box', outline: 'none',
};

const focusStyle: React.CSSProperties = {
  borderColor: '#7c3aed', boxShadow: '0 0 0 1px #7c3aed',
};

interface InitScreenProps {
  onStart: (config: { name: string; difficulty: number; playerColor: 'w' | 'b' }) => void;
  error: string | null;
  loading: boolean;
}

export default function InitScreen({ onStart, error, loading }: InitScreenProps) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState(6);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

  return (
    <div style={{
      background: '#0a0a0f', minHeight: '100vh', color: '#e2e8f0',
      fontFamily: 'monospace', padding: '2rem', maxWidth: 600, margin: '0 auto',
    }}>
      <div style={{ color: '#a78bfa', fontSize: '1.1rem', letterSpacing: '0.12em', marginBottom: '1.5rem' }}>
        GRIMCHESS
      </div>
      <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6 }}>
        Play a game against the chess bot.
      </div>

      <div style={{ background: '#11111c', border: '1px solid #29304a', borderRadius: 4, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
        <strong style={{ color: '#c4b5fd' }}>HOW TO PLAY</strong><br />
        Tap a piece, then tap its destination. Standard chess rules apply: pieces may move again on later turns, the queen may move along ranks, files, and diagonals, captures are legal, and illegal moves are rejected. After each legal move, the bot replies automatically.
      </div>

      {error && (
        <div style={{
          background: '#2a0a0a', border: '1px solid #7f1d1d', borderRadius: 4,
          padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#fca5a5',
        }}>
          <strong>ERROR:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.1em' }}>
          NAME (OPTIONAL)
        </label>
        <input
          value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Your name"
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.1em' }}>
          BOT STRENGTH
        </label>
        <select
          value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
        >
          {DIFFICULTY.map((d, i) => <option key={i} value={i}>{d.label}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', marginBottom: '0.3rem', letterSpacing: '0.1em' }}>
          PLAY AS
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setPlayerColor('w')}
            style={{
              flex: 1, background: playerColor === 'w' ? '#7c3aed' : '#1e1e2e',
              color: '#fff', border: '1px solid #334155', borderRadius: 4,
              padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer',
            }}
          >WHITE</button>
          <button
            onClick={() => setPlayerColor('b')}
            style={{
              flex: 1, background: playerColor === 'b' ? '#7c3aed' : '#1e1e2e',
              color: '#fff', border: '1px solid #334155', borderRadius: 4,
              padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer',
            }}
          >BLACK</button>
        </div>
      </div>

      <button
        onClick={() => onStart({ name, difficulty, playerColor })}
        disabled={loading}
        style={{
          background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 4,
          padding: '0.6rem 1.5rem', fontFamily: 'monospace', fontSize: '0.85rem',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.4 : 1,
        }}
      >
        {loading ? 'STARTING...' : 'START GAME'}
      </button>
    </div>
  );
}

export { DIFFICULTY };
