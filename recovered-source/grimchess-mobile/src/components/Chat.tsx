import type { ChatMessage } from '../types';

interface ChatProps {
  msgs: ChatMessage[];
  name: string;
  loading: boolean;
}

export default function Chat({ msgs, name, loading }: ChatProps) {
  return (
    <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {msgs.map((m, i) => (
        <div key={i} style={{
          borderLeft: m.role === 'assistant' ? '2px solid #7c3aed' : '2px solid #334155',
          paddingLeft: '0.75rem',
        }}>
          <div style={{
            fontSize: '0.6rem', color: m.role === 'user' ? '#64748b' : '#7c3aed',
            letterSpacing: '0.15em', marginBottom: '0.2rem',
          }}>
            {m.role === 'user' ? (name || 'PLAYER') : 'ORACLE'}
          </div>
          <div style={{
            fontSize: '0.8rem', lineHeight: 1.6,
            color: m.role === 'user' ? '#94a3b8' : '#e2e8f0',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {m.content}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ color: '#7c3aed', fontSize: '0.75rem', letterSpacing: '0.1em' }} aria-live="polite">▍</div>
      )}
    </div>
  );
}
