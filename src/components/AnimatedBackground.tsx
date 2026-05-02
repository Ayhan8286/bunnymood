import React from 'react';

// Floating petal/sparkle background animation
const AnimatedBackground: React.FC = () => {
  const petals = [
    { emoji: '🌸', size: 18, left: '8%',  animDur: '12s', delay: '0s',   opacity: 0.5 },
    { emoji: '🌸', size: 14, left: '22%', animDur: '15s', delay: '2s',   opacity: 0.35 },
    { emoji: '✨', size: 12, left: '35%', animDur: '10s', delay: '4s',   opacity: 0.45 },
    { emoji: '🌸', size: 20, left: '50%', animDur: '18s', delay: '1s',   opacity: 0.3  },
    { emoji: '💮', size: 16, left: '65%', animDur: '13s', delay: '6s',   opacity: 0.4  },
    { emoji: '✨', size: 10, left: '78%', animDur: '9s',  delay: '3s',   opacity: 0.5  },
    { emoji: '🌸', size: 22, left: '88%', animDur: '16s', delay: '5s',   opacity: 0.28 },
    { emoji: '💕', size: 12, left: '14%', animDur: '11s', delay: '7s',   opacity: 0.38 },
    { emoji: '🌷', size: 14, left: '42%', animDur: '14s', delay: '2.5s', opacity: 0.32 },
    { emoji: '✨', size: 16, left: '58%', animDur: '17s', delay: '4.5s', opacity: 0.42 },
    { emoji: '💗', size: 11, left: '72%', animDur: '12s', delay: '8s',   opacity: 0.36 },
    { emoji: '🌸', size: 15, left: '93%', animDur: '10s', delay: '1.5s', opacity: 0.44 },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      overflow: 'hidden', zIndex: 0,
    }}>
      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-60px) rotate(0deg) scale(1);   opacity: 0; }
          10%  { opacity: 1; }
          85%  { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg) scale(0.8); opacity: 0; }
        }
        @keyframes petalDrift {
          0%   { margin-left: 0; }
          25%  { margin-left: 18px; }
          50%  { margin-left: -10px; }
          75%  { margin-left: 14px; }
          100% { margin-left: 0; }
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.06); }
        }
      `}</style>

      {/* Soft gradient orbs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '55%', height: '55%', borderRadius: '50%',
        background: 'radial-gradient(circle, #fcd5e155 0%, #f8bbd060 40%, transparent 70%)',
        animation: 'bgPulse 8s ease-in-out infinite',
        filter: 'blur(50px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-8%',
        width: '60%', height: '60%', borderRadius: '50%',
        background: 'radial-gradient(circle, #e8d5f555 0%, #ce93d840 40%, transparent 70%)',
        animation: 'bgPulse 11s ease-in-out infinite reverse',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', top: '35%', left: '30%',
        width: '40%', height: '40%', borderRadius: '50%',
        background: 'radial-gradient(circle, #fff0f540 0%, transparent 70%)',
        animation: 'bgPulse 14s ease-in-out infinite',
        filter: 'blur(70px)',
      }} />

      {/* Falling petals */}
      {petals.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-40px',
            fontSize: p.size,
            opacity: p.opacity,
            animation: `petalFall ${p.animDur} linear ${p.delay} infinite, petalDrift ${parseFloat(p.animDur) * 0.6}s ease-in-out infinite`,
            userSelect: 'none',
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
};

export default AnimatedBackground;
