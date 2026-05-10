import React from 'react';
import { getPhaseDescription, type PredictionResult, type CyclePhase, type PhaseRange } from '../utils/cycleEngine';
import { CalendarPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

interface DashboardProps {
  stats: PredictionResult | null;
  onOpenLog: () => void;
  userName: string;
}

const phaseEmoji: Record<CyclePhase, string> = {
  Menstrual: '🌸', Follicular: '🌱', Ovulation: '✨', Luteal: '🌙',
};

const phaseColor: Record<CyclePhase, string> = {
  Menstrual: '#e57373', Follicular: '#66bb6a', Ovulation: '#ffb74d', Luteal: '#ba68c8',
};

const phaseBg: Record<CyclePhase, string> = {
  Menstrual:  'linear-gradient(135deg,#fce4ec,#fff0f5)',
  Follicular: 'linear-gradient(135deg,#e8f5e9,#f0fff4)',
  Ovulation:  'linear-gradient(135deg,#fff8e1,#fffbf0)',
  Luteal:     'linear-gradient(135deg,#f3e5f5,#fdf0ff)',
};

const phaseDesc: Record<CyclePhase, string> = {
  Menstrual:  'Bleeding & rest',
  Follicular: 'Rising energy & renewal',
  Ovulation:  'Peak energy & fertile days',
  Luteal:     'Slowing down & nesting',
};

const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const PhaseCard: React.FC<{ range: PhaseRange }> = ({ range }) => {
  const color = phaseColor[range.phase];
  const bg = phaseBg[range.phase];
  const days = Math.abs(range.daysUntilEnd) + Math.abs(range.daysUntilStart) + 1;

  let statusLabel = '';
  let statusColor = 'var(--text-muted)';
  if (range.isActive) {
    statusLabel = `Active — ${range.daysUntilEnd >= 0 ? range.daysUntilEnd + 1 : 0}d left`;
    statusColor = color;
  } else if (range.daysUntilStart > 0) {
    statusLabel = `In ${range.daysUntilStart}d`;
    statusColor = 'var(--text-light)';
  } else {
    statusLabel = 'Passed';
    statusColor = 'var(--text-muted)';
  }

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${color}${range.isActive ? '66' : '28'}`,
      borderRadius: 20,
      padding: '0.9rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      transition: 'all 0.3s ease',
      boxShadow: range.isActive ? `0 4px 20px ${color}28` : '0 2px 8px rgba(0,0,0,0.04)',
      transform: range.isActive ? 'scale(1.01)' : 'scale(1)',
    }}>
      {/* Emoji badge */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: `${color}18`,
        border: `2px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem',
        boxShadow: range.isActive ? `0 0 0 4px ${color}18` : 'none',
      }}>
        {phaseEmoji[range.phase]}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{range.phase}</span>
          {range.isActive && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
              background: color, color: 'white', borderRadius: 50, letterSpacing: 0.3
            }}>NOW</span>
          )}
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>{phaseDesc[range.phase]}</p>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)' }}>
          {fmt(range.start)} → {fmt(range.end)}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({days}d)</span>
        </p>
      </div>

      {/* Status */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>{statusLabel}</p>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ stats, onOpenLog, userName }) => {
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  useEffect(() => {
    Promise.resolve(supabase.from('period_entries').select('*', { count: 'exact', head: true }).eq('user_name', userName))
      .then(() => setDbOk(true)).catch(() => setDbOk(false));
  }, [userName]);

  if (!stats) {
    return (
      <div className="card animate-in flex-center" style={{ flexDirection: 'column', textAlign: 'center', padding: '3rem 2rem', gap: '1rem' }}>
        <div style={{ fontSize: '4rem' }} className="animate-float">🐰</div>
        <h2 style={{ color: 'var(--rose-dark)', fontFamily: 'Pacifico, cursive', fontWeight: 400 }}>Welcome 💕</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
          Add your first period date so I can learn your cycle and take care of you 🌸
        </p>
        <button onClick={onOpenLog} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarPlus size={18} /> Add my first period
        </button>
      </div>
    );
  }

  const { currentPhase, daysUntilNext, progress, cycleDay, averageCycleLength, nextPeriodDate, ovulationDate, phases } = stats;
  const color = phaseColor[currentPhase];
  const radius = 86;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  const fmtFull = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="animate-in">
      {/* ─── Cycle Wheel ───────────────────────── */}
      <div className="card flex-center" style={{
        flexDirection: 'column',
        background: phaseBg[currentPhase],
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: color + '22', color, border: `1.5px solid ${color}55`,
            borderRadius: 50, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 700,
          }}>
            {phaseEmoji[currentPhase]} {currentPhase} Phase
          </div>
          {dbOk !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: dbOk ? '#4caf50' : '#f44336' }}>
              {dbOk ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>{dbOk ? 'Synced' : 'Offline'}</span>
            </div>
          )}
        </div>

        {/* SVG wheel */}
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="100" cy="100" r={radius} fill="none" stroke="#fce4ec" strokeWidth="13" />
            <circle cx="100" cy="100" r={radius} fill="none"
              stroke={color} strokeWidth="13"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}88)` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '2rem' }}>{phaseEmoji[currentPhase]}</span>
            <span style={{ fontSize: '2.8rem', fontWeight: 700, color, lineHeight: 1.05 }}>{cycleDay}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>of {averageCycleLength} days</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', width: '100%', marginTop: '1.2rem' }}>
          {[
            { label: 'Next period', value: fmtFull(nextPeriodDate), sub: `${daysUntilNext}d away` },
            { label: 'Ovulation', value: fmtFull(ovulationDate), sub: 'estimated' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.72)', borderRadius: 16, padding: '0.8rem',
              textAlign: 'center', border: '1.5px solid var(--rose-light)'
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.92rem', marginTop: 2 }}>{item.value}</div>
              <div style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Today's vibe ─────────────────────── */}
      <div className="card" style={{ borderLeft: `4px solid ${color}`, marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.5rem' }}>
          Today's Vibe ✨
        </p>
        <p style={{ color: 'var(--text)', lineHeight: 1.65, fontSize: '0.93rem' }}>
          {getPhaseDescription(currentPhase)}
        </p>
      </div>

      {/* ─── All Phases Timeline ───────────────── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '1rem' }}>
          🗓 Your Cycle Timeline
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {phases.map(p => <PhaseCard key={p.phase} range={p} />)}
        </div>
      </div>

      <button onClick={onOpenLog} className="ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <CalendarPlus size={17} /> Log a period
      </button>
    </div>
  );
};

export default Dashboard;
