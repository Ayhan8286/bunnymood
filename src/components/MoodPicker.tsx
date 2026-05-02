import React, { useState } from 'react';
import { X } from 'lucide-react';

interface MoodPickerProps {
  onSave: (mood: string, symptoms: string[]) => void;
  onClose: () => void;
}

const moods = [
  { emoji: '😊', name: 'Happy',     color: '#f48fb1' },
  { emoji: '😌', name: 'Calm',      color: '#90caf9' },
  { emoji: '😔', name: 'Sad',       color: '#9fa8da' },
  { emoji: '⚡', name: 'Energetic', color: '#ffe082' },
  { emoji: '😴', name: 'Tired',     color: '#b0bec5' },
  { emoji: '🥺', name: 'Sensitive', color: '#ce93d8' },
  { emoji: '😤', name: 'Irritated', color: '#ef9a9a' },
  { emoji: '🥰', name: 'Loved',     color: '#f48fb1' },
];

const symptoms = ['🩸 Cramps', '🤕 Headache', '🫧 Bloating', '✨ Acne', '😬 Backache', '🍫 Cravings', '😮‍💨 Fatigue', '🥶 Chills'];

const MoodPicker: React.FC<MoodPickerProps> = ({ onSave, onClose }) => {
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: '#f4d0da', borderRadius: 10, margin: '0 auto 1.5rem' }} />

        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ color: 'var(--rose-dark)' }}>💭 How are you feeling?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>be honest, I'm here for you 🌸</p>
          </div>
          <button onClick={onClose} className="ghost" style={{ padding: '0.5rem', lineHeight: 0, borderRadius: '50%' }}>
            <X size={20} color="var(--rose-dark)" />
          </button>
        </div>

        {/* Mood grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {moods.map(m => (
            <button
              key={m.name}
              onClick={() => setSelectedMood(m.name)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '0.75rem 0.25rem',
                background: selectedMood === m.name ? m.color + '33' : 'rgba(255,255,255,0.7)',
                border: selectedMood === m.name ? `2px solid ${m.color}` : '1.5px solid var(--rose-light)',
                boxShadow: selectedMood === m.name ? `0 4px 14px ${m.color}44` : 'none',
                transform: selectedMood === m.name ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{m.emoji}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: selectedMood === m.name ? m.color : 'var(--text-muted)' }}>
                {m.name}
              </span>
            </button>
          ))}
        </div>

        {/* Symptoms */}
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: '0.6rem' }}>
          Any symptoms today?
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.5rem' }}>
          {symptoms.map(s => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              style={{
                padding: '0.45rem 0.9rem', fontSize: '0.78rem', fontWeight: 600,
                background: selectedSymptoms.includes(s) ? 'var(--blush)' : 'rgba(255,255,255,0.8)',
                color: selectedSymptoms.includes(s) ? 'var(--rose-dark)' : 'var(--text-muted)',
                border: selectedSymptoms.includes(s) ? '1.5px solid var(--rose)' : '1.5px solid var(--rose-light)',
                boxShadow: 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => { onSave(selectedMood, selectedSymptoms); onClose(); }}
          style={{ width: '100%', padding: '1rem' }}
          disabled={!selectedMood}
        >
          Save today's log 💕
        </button>
      </div>
    </div>
  );
};

export default MoodPicker;
