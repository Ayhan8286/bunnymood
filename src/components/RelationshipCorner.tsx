import React from 'react';
import { type PredictionResult, type CyclePhase } from '../utils/cycleEngine';
import { HeartHandshake } from 'lucide-react';

const supportData: Record<CyclePhase, { emoji: string; title: string; color: string }> = {
  Menstrual:  { emoji: '🫂', title: 'Be extra gentle with her',  color: '#e57373' },
  Follicular: { emoji: '💃', title: "She's feeling alive!",      color: '#81c784' },
  Ovulation:  { emoji: '✨', title: "She's glowing!",            color: '#ffb74d' },
  Luteal:     { emoji: '🌙', title: 'She needs cozy love',       color: '#ba68c8' },
};

interface RelationshipCornerProps {
  stats: PredictionResult | null;
  husbandTip?: string;
  wifeTip?: string;
}

const LoadingDots = ({ color }: { color: string }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        background: color,
        animation: `float ${0.5 + i * 0.15}s ease-in-out infinite alternate`
      }} />
    ))}
  </div>
);

const RelationshipCorner: React.FC<RelationshipCornerProps> = ({ stats, husbandTip, wifeTip }) => {
  if (!stats) return null;

  const { currentPhase } = stats;
  const data = supportData[currentPhase];

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      border: '1.5px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      padding: '1.3rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
        <div style={{
          fontSize: '1.5rem', lineHeight: 1,
          background: 'rgba(244, 160, 181, 0.15)',
          borderRadius: '50%', padding: '0.55rem',
        }}>
          💕
        </div>
        <div>
          <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 700 }}>Relationship Corner</h3>
          <p style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            She's in her <span style={{ color: data.color }}>{currentPhase}</span> phase · Day {stats.cycleDay}
          </p>
        </div>
      </div>

      {/* ─── Husband's Section ─── */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{data.emoji}</span>
          <div>
            <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Husband's corner 💌
            </p>
            <p style={{ fontSize: '0.78rem', color: 'white', fontWeight: 700 }}>{data.title}</p>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '0.85rem',
        }}>
          {!husbandTip
            ? <LoadingDots color="rgba(255,255,255,0.5)" />
            : <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.72, whiteSpace: 'pre-wrap' }}>
                {husbandTip}
              </p>
          }
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(187, 134, 252, 0.3), transparent)',
        margin: '0.3rem 0 1rem',
      }} />

      {/* ─── Wifey's Section ─── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <HeartHandshake size={18} color="#bb86fc" />
          <div>
            <p style={{ fontSize: '0.6rem', color: 'rgba(187, 134, 252, 0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Wifey's corner 👑
            </p>
            <p style={{ fontSize: '0.78rem', color: 'white', fontWeight: 700 }}>How to support him</p>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(187, 134, 252, 0.12)',
          borderRadius: 14,
          padding: '0.85rem',
        }}>
          {!wifeTip
            ? <LoadingDots color="rgba(187, 134, 252, 0.5)" />
            : <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.72, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                {wifeTip}
              </p>
          }
        </div>
      </div>

      {/* Footer */}
      <p style={{
        color: 'rgba(255,255,255,0.2)', fontSize: '0.62rem',
        textAlign: 'center', marginTop: '0.9rem',
      }}>
        Based on both your journals & her cycle 🐰
      </p>
    </div>
  );
};

export default RelationshipCorner;
