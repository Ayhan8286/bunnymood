import React, { useState } from 'react';
import { PenLine, BookHeart } from 'lucide-react';

interface JournalCardProps {
  journals: any[];
  onWrite: (type: 'personal' | 'husband') => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ journals, onWrite }) => {
  const [tab, setTab] = useState<'personal' | 'husband'>('personal');
  const filtered = journals.filter(j => j.entry_type === tab).slice(0, 3);

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="card" style={{
      background: tab === 'personal'
        ? 'linear-gradient(160deg,#fff0f5,#fff8fb)'
        : 'linear-gradient(160deg,#f5f0ff,#faf0ff)',
      height: '100%',
    }}>
      {/* Header + Write button */}
      <div className="flex-between" style={{ marginBottom: '0.9rem' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', color: tab === 'personal' ? 'var(--rose-dark)' : 'var(--lavender-dark)' }}>
            {tab === 'personal' ? '📖 My Journal' : '💌 Husband\'s Notes'}
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {tab === 'personal' ? 'your safe space 🌸' : 'his observations 💕'}
          </p>
        </div>
        <button
          onClick={() => onWrite(tab)}
          style={{
            padding: '0.45rem 0.9rem', fontSize: '0.78rem',
            display: 'flex', alignItems: 'center', gap: 5,
            background: tab === 'personal'
              ? 'linear-gradient(135deg,var(--rose),var(--rose-dark))'
              : 'linear-gradient(135deg,var(--lavender-dark),#9b5de5)',
          }}
        >
          <PenLine size={13} /> Write
        </button>
      </div>

      {/* Tab toggle */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.65)',
        borderRadius: 50, padding: 3, gap: 3, marginBottom: '0.9rem',
        border: '1px solid rgba(255,192,210,0.2)'
      }}>
        {(['personal', 'husband'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '0.42rem', fontSize: '0.73rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: tab === t
                ? t === 'personal'
                  ? 'linear-gradient(135deg,var(--rose),var(--rose-dark))'
                  : 'linear-gradient(135deg,var(--lavender-dark),#9b5de5)'
                : 'none',
              boxShadow: tab === t ? 'var(--shadow-pink)' : 'none',
              color: tab === t ? 'white' : 'var(--text-muted)',
            }}
          >
            {t === 'personal' ? <><BookHeart size={12} /> Mine</> : <><PenLine size={12} /> Husband</>}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
              {tab === 'personal' ? '🌸' : '💌'}
            </div>
            <p>{tab === 'personal' ? 'Nothing written yet' : 'No notes yet'}</p>
            <p style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>tap Write to add an entry</p>
          </div>
        ) : (
          filtered.map(j => (
            <div key={j.id} style={{
              padding: '0.75rem 0.85rem',
              borderRadius: 16,
              background: tab === 'personal' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.7)',
              border: `1.5px solid ${tab === 'personal' ? 'var(--rose-light)' : 'var(--lavender)'}`,
            }}>
              <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                <span style={{
                  fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
                  color: tab === 'personal' ? 'var(--rose-dark)' : 'var(--lavender-dark)'
                }}>
                  {fmtDate(j.journal_date)}
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  {new Date(j.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{
                color: 'var(--text)', fontSize: '0.85rem', lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {j.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JournalCard;
