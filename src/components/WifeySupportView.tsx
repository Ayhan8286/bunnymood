import React from 'react';
import { type PredictionResult } from '../utils/cycleEngine';
import { HeartHandshake } from 'lucide-react';

interface WifeySupportViewProps {
  stats: PredictionResult | null;
  tip?: string;
}

const WifeySupportView: React.FC<WifeySupportViewProps> = ({ stats, tip }) => {
  if (!stats) return null;

  return (
    <div className="card" style={{ 
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)', 
      border: '1.5px solid rgba(187, 134, 252, 0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ 
          fontSize: '1.7rem', 
          lineHeight: 1, 
          background: 'rgba(187, 134, 252, 0.15)', 
          borderRadius: '50%', 
          padding: '0.5rem',
          color: '#bb86fc'
        }}>
          <HeartHandshake size={24} />
        </div>
        <div>
          <p style={{ 
            fontSize: '0.64rem', 
            color: 'rgba(187, 134, 252, 0.6)', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: 0.5 
          }}>Wifey's corner 👑</p>
          <h3 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>How to support him</h3>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: 14, 
        padding: '0.9rem' 
      }}>
        {!tip ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ 
                width: 7, 
                height: 7, 
                borderRadius: '50%', 
                background: 'rgba(187, 134, 252, 0.5)', 
                animation: `float ${0.5 + i * 0.15}s ease-in-out infinite alternate` 
              }} />
            ))}
          </div>
        ) : (
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '0.87rem', 
            lineHeight: 1.7, 
            whiteSpace: 'pre-wrap',
            fontStyle: 'italic'
          }}>
            {tip}
          </p>
        )}
      </div>

      <p style={{ 
        color: 'rgba(255,255,255,0.25)', 
        fontSize: '0.66rem', 
        textAlign: 'center', 
        marginTop: '0.7rem' 
      }}>
        Based on his latest notes 💌
      </p>
    </div>
  );
};

export default WifeySupportView;
