import React, { useState } from 'react';
import { X } from 'lucide-react';

interface MoodPickerProps {
  onSave: (moods: string[], symptoms: string[]) => void;
  onClose: () => void;
}

const moods = [
  { emoji: '😊', name: 'Happy',       color: '#f48fb1' },
  { emoji: '😌', name: 'Calm',        color: '#90caf9' },
  { emoji: '😔', name: 'Sad',         color: '#9fa8da' },
  { emoji: '⚡', name: 'Energetic',   color: '#ffe082' },
  { emoji: '😴', name: 'Tired',       color: '#b0bec5' },
  { emoji: '🥺', name: 'Sensitive',   color: '#ce93d8' },
  { emoji: '😤', name: 'Irritated',   color: '#ef9a9a' },
  { emoji: '🥰', name: 'Loved',       color: '#f48fb1' },
  { emoji: '🤔', name: 'Anxious',     color: '#b39ddb' },
  { emoji: '🧘', name: 'Peaceful',    color: '#80cbc4' },
  { emoji: '🫠', name: 'Overwhelmed', color: '#ffab91' },
  { emoji: '🤩', name: 'Excited',     color: '#ffd54f' },
  { emoji: '🥱', name: 'Bored',       color: '#d1d1d1' },
  { emoji: '💃', name: 'Social',      color: '#f06292' },
  { emoji: '🕯️', name: 'Romantic',    color: '#ec407a' },
  { emoji: '🌙', name: 'Reflective',  color: '#7986cb' },
];

const symptoms = [
  '🩸 Cramps', '🤕 Headache', '🫧 Bloating', '✨ Acne', 
  '😬 Backache', '🍫 Cravings', '😮‍💨 Fatigue', '🥶 Chills',
  '🥛 Breast tenderness', '🤢 Nausea', '🏃‍♀️ Active', '🧠 Brain fog',
  '🍬 Sugar cravings', '🧂 Salt cravings', '💧 Water retention', '💤 Insomnia'
];

const MoodPicker: React.FC<MoodPickerProps> = ({ onSave, onClose }) => {
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const toggleMood = (m: string) =>
    setSelectedMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: '#f4d0da', borderRadius: 10, margin: '0 auto 1.5rem' }} />

        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ color: 'var(--rose-dark)' }}>💭 How are you feeling?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>select all that apply, I'm here for you 🌸</p>
          </div>
          <button onClick={onClose} className="ghost" style={{ padding: '0.5rem', lineHeight: 0, borderRadius: '50%' }}>
            <X size={20} color="var(--rose-dark)" />
          </button>
        </div>

        {/* Mood grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem', maxHeight: '40vh', overflowY: 'auto', padding: '0.5rem' }}>
          {moods.map(m => (
            <button
              key={m.name}
              onClick={() => toggleMood(m.name)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '0.75rem 0.25rem',
                background: selectedMoods.includes(m.name) ? m.color + '33' : 'rgba(255,255,255,0.7)',
                border: selectedMoods.includes(m.name) ? `2px solid ${m.color}` : '1.5px solid var(--rose-light)',
                boxShadow: selectedMoods.includes(m.name) ? `0 4px 14px ${m.color}44` : 'none',
                transform: selectedMoods.includes(m.name) ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{m.emoji}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: selectedMoods.includes(m.name) ? m.color : 'var(--text-muted)' }}>
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
                borderRadius: '20px'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => { onSave(selectedMoods, selectedSymptoms); onClose(); }}
          style={{ width: '100%', padding: '1rem', borderRadius: '16px' }}
          disabled={selectedMoods.length === 0}
        >
          Save today's log 💕
        </button>
      </div>
    </div>
  );
};

export default MoodPicker;
