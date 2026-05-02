import React, { useEffect, useState } from 'react';
import { Sparkles, Heart, TrendingUp } from 'lucide-react';
import type { PredictionResult } from '../utils/cycleEngine';
import { getPhaseInsight, getCalmingMessage, analyzePatterns, type UserContext } from '../lib/groq';

interface BunnyAIProps {
  stats: PredictionResult | null;
  ctx: UserContext;
}

type Tab = 'insight' | 'calm' | 'patterns';

const BunnyAI: React.FC<BunnyAIProps> = ({ stats, ctx }) => {
  const [messages, setMessages] = useState<Record<Tab, string>>({ insight: '', calm: '', patterns: '' });
  const [loading, setLoading] = useState<Tab | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('insight');

  const load = async (tab: Tab, force = false) => {
    if (messages[tab] && !force) { setActiveTab(tab); return; }
    setLoading(tab);
    setActiveTab(tab);
    try {
      let msg = '';
      if (tab === 'insight') msg = await getPhaseInsight(ctx);
      else if (tab === 'calm') msg = await getCalmingMessage(ctx);
      else msg = await analyzePatterns(ctx);
      setMessages(prev => ({ ...prev, [tab]: msg }));
    } catch {
      setMessages(prev => ({ ...prev, [tab]: 'Bunny is resting right now 🐰 try again in a moment!' }));
    } finally {
      setLoading(null);
    }
  };

  // Auto-load insight on mount when stats are ready
  useEffect(() => {
    if (stats && !messages.insight) load('insight');
  }, [stats?.currentPhase]);

  if (!stats) return null;

  const displayed = messages[activeTab];
  const isLoading = loading === activeTab;

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'insight',  icon: <Sparkles size={13} />, label: "Today's vibe" },
    { id: 'calm',     icon: <Heart size={13} />,    label: "Calm me 🌸" },
    { id: 'patterns', icon: <TrendingUp size={13} />, label: "My patterns" },
  ];

  return (
    <div className="card" style={{
      background: 'linear-gradient(160deg,#fff0f5,#f8f0ff)',
      border: '1.5px solid var(--rose-light)',
    }}>
      {/* Header — NO refresh button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.9rem' }}>
        <span className="animate-float" style={{ fontSize: '1.35rem', lineHeight: 1 }}>🐰</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.87rem', color: 'var(--text)' }}>Bunny — your companion</p>
          <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>reads your mood & journals 💫</p>
        </div>
      </div>

      {/* Tab pills */}
      <div style={{
        display: 'flex', gap: '0.35rem', marginBottom: '0.85rem',
        background: 'rgba(255,255,255,0.62)', borderRadius: 50, padding: 3,
        border: '1px solid rgba(255,192,210,0.18)',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => load(t.id)}
            disabled={loading === t.id}
            style={{
              flex: 1, padding: '0.42rem 0.2rem', fontSize: '0.7rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: activeTab === t.id
                ? 'linear-gradient(135deg,var(--rose),var(--rose-dark))'
                : 'none',
              boxShadow: activeTab === t.id ? 'var(--shadow-pink)' : 'none',
              color: activeTab === t.id ? 'white' : 'var(--text-muted)',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* AI bubble */}
      <div className="ai-bubble" style={{ minHeight: 60 }}>
        {isLoading ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)',
                animation: `float ${0.55 + i * 0.15}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        ) : (
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.65 }}>
            {displayed || 'Tap a tab above to get a message from Bunny 🐰'}
          </p>
        )}
      </div>
    </div>
  );
};

export default BunnyAI;
