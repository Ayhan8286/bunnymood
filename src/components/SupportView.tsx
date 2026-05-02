import React from 'react';
import { getSupportTips, type PredictionResult, type CyclePhase } from '../utils/cycleEngine';

const supportData: Record<CyclePhase, { emoji: string; title: string; color: string; bg: string }> = {
  Menstrual:  { emoji: '🫂', title: 'Be extra gentle with her',  color: '#e57373', bg: 'linear-gradient(135deg,#2b1a1f,#3d1f28)' },
  Follicular: { emoji: '💃', title: "She's feeling alive!",      color: '#81c784', bg: 'linear-gradient(135deg,#1a2b1c,#1f3d24)' },
  Ovulation:  { emoji: '✨', title: "She's glowing!",            color: '#ffb74d', bg: 'linear-gradient(135deg,#2b2214,#3d311a)' },
  Luteal:     { emoji: '🌙', title: 'She needs cozy love',       color: '#ba68c8', bg: 'linear-gradient(135deg,#1e1428,#2a1d38)' },
};

interface SupportViewProps {
  stats: PredictionResult | null;
  tip?: string;
}

const SupportView: React.FC<SupportViewProps> = ({ stats, tip }) => {

  if (!stats) return null;
  const { currentPhase } = stats;
  const data = supportData[currentPhase];
  const displayed = tip || getSupportTips(currentPhase);

  return (
    <div className="card" style={{ background: data.bg, border: 'none' }}>
      {/* Header — no refresh button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.7rem', lineHeight: 1, background: data.color + '22', borderRadius: '50%', padding: '0.5rem' }}>
          {data.emoji}
        </div>
        <div>
          <p style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.38)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Husband's corner 💌</p>
          <h3 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>{data.title}</h3>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '0.9rem' }}>
        {!tip
          ? <div style={{ display: 'flex', gap: 6 }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', animation: `float ${0.5+i*0.15}s ease-in-out infinite alternate` }} />)}</div>
          : <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.87rem', lineHeight: 1.72, whiteSpace: 'pre-wrap' }}>{displayed}</p>
        }
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.66rem', textAlign: 'center', marginTop: '0.7rem' }}>
        She's in her <span style={{ color: data.color }}>{currentPhase}</span> phase · Day {stats.cycleDay}
      </p>
    </div>
  );
};

export default SupportView;
