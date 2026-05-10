import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';

interface MonitoringSystemProps {
  userName: string;
}

const MonitoringSystem: React.FC<MonitoringSystemProps> = ({ userName }) => {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [counts, setCounts] = useState({ periods: 0, moods: 0, journals: 0 });

  useEffect(() => {
    async function checkHealth() {
      try {
        const [{ count: p }, { count: m }, { count: j }] = await Promise.all([
          supabase.from('period_entries').select('*', { count: 'exact', head: true }).eq('user_name', userName),
          supabase.from('mood_logs').select('*', { count: 'exact', head: true }).eq('user_name', userName),
          supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_name', userName),
        ]);

        setCounts({
          periods: p || 0,
          moods: m || 0,
          journals: j || 0
        });
        setStatus('ok');
      } catch (err) {
        console.error('Database health check failed:', err);
        setStatus('error');
      }
    }

    checkHealth();
  }, [userName]);

  if (status === 'loading') return null;

  return (
    <div className="card" style={{ padding: '0.8rem 1rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255, 192, 210, 0.3)' }}>
      <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="var(--rose-dark)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--rose-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            System Status
          </span>
        </div>
        {status === 'ok' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4caf50' }}>
            <CheckCircle2 size={14} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Connected</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f44336' }}>
            <AlertCircle size={14} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Sync Error</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Periods</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--rose-dark)' }}>{counts.periods}</p>
        </div>
        <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Moods</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--rose-dark)' }}>{counts.moods}</p>
        </div>
        <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Notes</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--rose-dark)' }}>{counts.journals}</p>
        </div>
      </div>
    </div>
  );
};

export default MonitoringSystem;
