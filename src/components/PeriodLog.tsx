import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { PeriodEntry } from '../utils/cycleEngine';

interface PeriodLogProps {
  onSave: (entry: PeriodEntry) => void;
  onClose: () => void;
}

const PeriodLog: React.FC<PeriodLogProps> = ({ onSave, onClose }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crypto.randomUUID(),
      startDate: new Date(startDate),
      duration: Number(duration),
    });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: '#f4d0da', borderRadius: 10, margin: '0 auto 1.5rem' }} />

        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ color: 'var(--rose-dark)' }}>🌸 Log a Period</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>let's track your cycle together</p>
          </div>
          <button onClick={onClose} className="ghost" style={{ padding: '0.5rem', lineHeight: 0, borderRadius: '50%' }}>
            <X size={20} color="var(--rose-dark)" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: '0.4rem' }}>
            📅 When did it start?
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            style={{ marginBottom: '1rem' }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: '0.4rem' }}>
            🗓 How many days did it last?
          </label>
          <input
            type="number"
            min={1}
            max={14}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            required
          />

          {/* Duration visual hint */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem', justifyContent: 'center' }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%',
                background: i < duration ? 'linear-gradient(135deg, var(--rose), var(--rose-dark))' : 'var(--rose-light)',
                transition: 'background 0.2s',
                cursor: 'pointer',
                boxShadow: i < duration ? 'var(--shadow-pink)' : 'none'
              }}
                onClick={() => setDuration(i + 1)}
              />
            ))}
          </div>

          <button type="submit" style={{ width: '100%', padding: '1rem' }}>
            Save 💕
          </button>
        </form>
      </div>
    </div>
  );
};

export default PeriodLog;
