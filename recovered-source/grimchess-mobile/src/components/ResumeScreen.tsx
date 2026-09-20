import { DIFFICULTY } from './InitScreen';

interface ResumeScreenProps {
  name: string;
  moveCount: number;
  difficulty: number;
  onResume: () => void;
  onReset: () => void;
}

export default function ResumeScreen({
  name, moveCount, difficulty, onResume, onReset,
}: ResumeScreenProps) {
  return (
    <div style={{
      background: '#0a0a0f', minHeight: '100vh', color: '#e2e8f0',
      fontFamily: 'monospace', padding: '2rem', maxWidth: 600,
      margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    }}>
      <div style={{ color: '#a78bfa', fontSize: '1.1rem', letterSpacing: '0.12em', marginBottom: '1.5rem' }}>
        GRIMCHESS
      </div>
      <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.8 }}>
        Continue your game{ name ? `, ${name}` : '' }?<br />
        <span style={{ color: '#64748b' }}>Moves played:</span> {moveCount}<br />
        <span style={{ color: '#64748b' }}>Opponent:</span> Grimchess bot — {DIFFICULTY[difficulty]?.name || 'SYSTEMS'}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onResume}
          style={{
            background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 4,
            padding: '0.6rem 1.5rem', fontFamily: 'monospace', fontSize: '0.85rem', cursor: 'pointer',
          }}
        >CONTINUE</button>
        <button
          onClick={onReset}
          style={{
            background: 'none', color: '#64748b', border: '1px solid #334155',
            borderRadius: 4, padding: '0.6rem 1.5rem',
            fontFamily: 'monospace', fontSize: '0.85rem', cursor: 'pointer',
          }}
        >NEW GAME</button>
      </div>
    </div>
  );
}
