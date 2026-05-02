import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { PeriodEntry } from '../utils/cycleEngine';

interface BulkPeriodLogProps {
  onSave: (entries: PeriodEntry[]) => void;
  onClose: () => void;
}

interface Row { id: string; startDate: string; duration: number; }

const BulkPeriodLog: React.FC<BulkPeriodLogProps> = ({ onSave, onClose }) => {
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), startDate: '', duration: 5 },
  ]);

  const addRow = () =>
    setRows(r => [...r, { id: crypto.randomUUID(), startDate: '', duration: 5 }]);

  const removeRow = (id: string) =>
    setRows(r => r.filter(x => x.id !== id));

  const update = (id: string, field: keyof Row, value: string | number) =>
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = rows.filter(r => r.startDate);
    if (valid.length === 0) return;
    onSave(valid.map(r => ({
      id: crypto.randomUUID(),
      startDate: new Date(r.startDate),
      duration: Number(r.duration),
    })));
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width:40, height:4, background:'#f4d0da', borderRadius:10, margin:'0 auto 1.5rem' }} />

        <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
          <div>
            <h3 style={{ color:'var(--rose-dark)' }}>📅 Add Period Dates</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>add past dates so I can learn your rhythm 💕</p>
          </div>
          <button onClick={onClose} className="ghost" style={{ padding:'0.5rem', lineHeight:0, borderRadius:'50%' }}>
            <X size={20} color="var(--rose-dark)" />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 40px', gap:'0.5rem', marginBottom:'0.5rem', paddingLeft:'0.5rem' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)' }}>START DATE</span>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textAlign:'center' }}>DAYS</span>
            <span />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'1rem' }}>
            {rows.map((row, idx) => (
              <div key={row.id} style={{ display:'grid', gridTemplateColumns:'1fr 80px 40px', gap:'0.5rem', alignItems:'center' }}>
                <input
                  type="date"
                  value={row.startDate}
                  onChange={e => update(row.id, 'startDate', e.target.value)}
                  style={{ marginBottom:0, fontSize:'0.88rem' }}
                  required={idx === 0}
                />
                <input
                  type="number"
                  min={1} max={14}
                  value={row.duration}
                  onChange={e => update(row.id, 'duration', Number(e.target.value))}
                  style={{ marginBottom:0, fontSize:'0.88rem', textAlign:'center', padding:'0.9rem 0.4rem' }}
                />
                <button
                  type="button"
                  onClick={() => rows.length > 1 && removeRow(row.id)}
                  className="ghost"
                  style={{ padding:'0.5rem', borderRadius:'50%', lineHeight:0, boxShadow:'none', border:'none', opacity: rows.length === 1 ? 0.3 : 1 }}
                >
                  <Trash2 size={16} color="var(--rose-dark)" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addRow} className="ghost" style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:'1rem', fontSize:'0.88rem' }}>
            <Plus size={16} /> Add another date
          </button>

          <button type="submit" style={{ width:'100%', padding:'1rem' }}>
            Save {rows.filter(r => r.startDate).length} date{rows.filter(r => r.startDate).length !== 1 ? 's' : ''} 💕
          </button>
        </form>
      </div>
    </div>
  );
};

export default BulkPeriodLog;
