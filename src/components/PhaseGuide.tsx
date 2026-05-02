import React, { useEffect, useState } from 'react';
import type { PredictionResult, CyclePhase } from '../utils/cycleEngine';
import { getAIPhaseGuide, type UserContext } from '../lib/groq';

interface PhaseGuideProps {
  stats: PredictionResult | null;
  view: 'her' | 'husband';
  ctx: UserContext;
}

const phaseColor: Record<CyclePhase, string> = {
  Menstrual: '#e57373', Follicular: '#66bb6a', Ovulation: '#ffb74d', Luteal: '#ba68c8',
};
const phaseBg: Record<CyclePhase, string> = {
  Menstrual:  'linear-gradient(135deg,#fff0f0,#fff5f8)',
  Follicular: 'linear-gradient(135deg,#f0fff2,#f5fff8)',
  Ovulation:  'linear-gradient(135deg,#fffbf0,#fff8e8)',
  Luteal:     'linear-gradient(135deg,#fdf0ff,#f8f0ff)',
};
const phaseEmoji: Record<CyclePhase, string> = {
  Menstrual: '🌸', Follicular: '🌱', Ovulation: '✨', Luteal: '🌙',
};

// Parse list items from AI response
const parseLines = (text: string): string[] =>
  text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l !== '-');

// Skeleton shimmer line
const Skeleton = ({ width = '100%', height = 14 }: { width?: string; height?: number }) => (
  <div style={{
    width, height, borderRadius: 8,
    background: 'linear-gradient(90deg,#fce4ec33 25%,#fce4ec66 50%,#fce4ec33 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    marginBottom: 8,
  }} />
);

const PhaseGuide: React.FC<PhaseGuideProps> = ({ stats, view, ctx }) => {
  const [guide, setGuide] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!stats) return;
    // Reset if phase changed
    setLoaded(false);
    setGuide([]);
  }, [stats?.currentPhase, view]);

  useEffect(() => {
    if (!stats || loaded) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const text = await getAIPhaseGuide(ctx, view);
        if (!cancelled) {
          setGuide(parseLines(text));
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setGuide(['🐰 Could not load guide right now — try refreshing the page!']);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [stats?.currentPhase, view, loaded]);

  if (!stats) return null;
  const { currentPhase } = stats;
  const color = phaseColor[currentPhase];
  const bg = phaseBg[currentPhase];

  return (
    <div className="card" style={{ background: bg, border: `1.5px solid ${color}28` }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: `${color}18`, border: `2px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          boxShadow: `0 0 0 ${loading ? '6px' : '0px'} ${color}18`,
          transition: 'box-shadow 0.4s ease',
        }}>
          {phaseEmoji[currentPhase]}
        </div>
        <div>
          <h3 style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
            {view === 'her'
              ? `Your ${currentPhase} Guide — today`
              : `Husband\'s Guide — ${currentPhase}`}
          </h3>
          <p style={{ fontSize: '0.67rem', color, fontWeight: 700 }}>
            {view === 'her' ? '💕 personalised to your mood' : '💌 tailored to support her today'}
          </p>
        </div>
        {/* Auto-refresh indicator */}
        <div style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right', lineHeight: 1.4 }}>
          updates<br />daily 🌙
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ paddingTop: 4 }}>
          <Skeleton width="85%" />
          <Skeleton width="72%" />
          <Skeleton width="90%" />
          <Skeleton width="68%" />
          <Skeleton width="78%" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.42rem' }}>
          {guide.map((line, i) => {
            // Split emoji from text
            const firstSpace = line.indexOf(' ');
            const emoji = firstSpace > 0 && firstSpace <= 3 ? line.slice(0, firstSpace) : '';
            const text = emoji ? line.slice(firstSpace + 1) : line;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {emoji && <span style={{ flexShrink: 0, marginTop: 1 }}>{emoji}</span>}
                <span>{text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PhaseGuide;
