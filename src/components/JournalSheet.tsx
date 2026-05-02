import React, { useState } from 'react';
import { X, BookHeart, PenLine } from 'lucide-react';

interface JournalSheetProps {
  type: 'personal' | 'husband';
  userName: string;
  onSave: (type: 'personal' | 'husband', content: string) => void;
  onClose: () => void;
}

const JournalSheet: React.FC<JournalSheetProps> = ({ type, onSave, onClose }) => {
  const [content, setContent] = useState('');

  const isPersonal = type === 'personal';
  const title = isPersonal ? "Dear Diary… 📖" : "Husband's Observations 💌";
  const subtitle = isPersonal
    ? "Write anything you feel — no judgment, just you 🌸"
    : "How is she today? What did you notice? Write it down 💕";
  const placeholder = isPersonal
    ? "Today I feel… I noticed… I want…"
    : "She seemed… I noticed that… I want to help her by…";
  const color = isPersonal ? 'var(--rose-dark)' : 'var(--lavender-dark)';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave(type, content.trim());
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div style={{ width: 40, height: 4, background: '#f4d0da', borderRadius: 10, margin: '0 auto 1.5rem' }} />

        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: isPersonal ? 'var(--blush)' : 'var(--lavender)',
              borderRadius: '50%', padding: '0.45rem', lineHeight: 0
            }}>
              {isPersonal ? <BookHeart size={18} color={color} /> : <PenLine size={18} color={color} />}
            </div>
            <div>
              <h3 style={{ color, fontSize: '1rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="ghost" style={{ padding: '0.5rem', borderRadius: '50%', lineHeight: 0, border: 'none', boxShadow: 'none' }}>
            <X size={19} color="var(--text-muted)" />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <textarea
            placeholder={placeholder}
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 200))}
            maxLength={200}
            style={{
              width: '100%',
              minHeight: 100,
              maxHeight: 140,
              padding: '0.9rem 1rem',
              borderRadius: 16,
              border: `1.5px solid ${isPersonal ? 'var(--rose-light)' : 'var(--lavender)'}`,
              background: isPersonal ? '#fff8fb' : '#f9f0ff',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.95rem',
              lineHeight: 1.65,
              color: 'var(--text)',
              resize: 'none',
              outline: 'none',
              marginBottom: '0.4rem',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = isPersonal ? 'var(--rose)' : 'var(--lavender-dark)'}
            onBlur={e => e.target.style.borderColor = isPersonal ? 'var(--rose-light)' : 'var(--lavender)'}
          />
          <div style={{ textAlign: 'right', fontSize: '0.68rem', color: content.length > 160 ? 'var(--rose-dark)' : 'var(--text-muted)', marginBottom: '1rem' }}>
            {content.length} / 200
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={onClose} type="button" className="ghost" style={{ flex: 1, padding: '0.85rem' }}>Cancel</button>
            <button
              type="submit"
              disabled={!content.trim()}
              style={{
                flex: 2, padding: '0.85rem',
                background: isPersonal
                  ? 'linear-gradient(135deg, var(--rose), var(--rose-dark))'
                  : 'linear-gradient(135deg, var(--lavender-dark), #9b5de5)',
              }}
            >
              Save entry 💕
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalSheet;
