import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isWithinInterval, startOfDay } from 'date-fns';
import type { PredictionResult, CyclePhase } from '../utils/cycleEngine';

interface CalendarProps {
  stats: PredictionResult | null;
}

const phaseColors: Record<CyclePhase, string> = {
  Menstrual: '#ffebf0',  // Soft rose
  Follicular: '#e8f5e9', // Soft green
  Ovulation: '#fff3e0',  // Soft orange
  Luteal: '#f3e5f5',     // Soft purple
};

const phaseBorderColors: Record<CyclePhase, string> = {
  Menstrual: '#ff8a80',
  Follicular: '#81c784',
  Ovulation: '#ffb74d',
  Luteal: '#ba68c8',
};

const Calendar: React.FC<CalendarProps> = ({ stats }) => {
  const today = startOfDay(new Date());
  
  // Render current month by default
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getPhaseForDate = (date: Date): CyclePhase | null => {
    if (!stats) return null;
    const activeRange = stats.phases.find(p => 
      isWithinInterval(date, { start: startOfDay(p.start), end: startOfDay(p.end) })
    );
    return activeRange ? activeRange.phase : null;
  };

  return (
    <div className="card" style={{ padding: '1rem', background: '#fff', border: '1.5px solid var(--rose-light)' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--rose-dark)', fontSize: '1rem', fontWeight: 700 }}>
          {format(today, 'MMMM yyyy')}
        </h3>
        {stats && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: 10 }}>
            Day {stats.cycleDay}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: '0.5rem' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, today);
          const phase = getPhaseForDate(day);
          
          return (
            <div 
              key={i} 
              style={{
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: isToday ? 700 : 500,
                color: isCurrentMonth ? 'var(--text)' : 'var(--text-muted)',
                opacity: isCurrentMonth ? 1 : 0.4,
                background: phase && isCurrentMonth ? phaseColors[phase] : 'transparent',
                borderRadius: '50%',
                border: isToday 
                  ? '2px solid var(--rose-dark)' 
                  : (phase && isCurrentMonth ? `1px solid ${phaseBorderColors[phase]}66` : '1px solid transparent'),
                boxShadow: isToday ? '0 2px 6px rgba(255,107,158,0.2)' : 'none',
                cursor: 'default',
                position: 'relative'
              }}
            >
              {format(day, 'd')}
              
              {/* Little dot for today if inside a phase color */}
              {isToday && phase && (
                <div style={{
                  position: 'absolute',
                  bottom: 3,
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: 'var(--rose-dark)'
                }} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
        {(['Menstrual', 'Follicular', 'Ovulation', 'Luteal'] as CyclePhase[]).map(phase => (
          <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: phaseColors[phase], border: `1px solid ${phaseBorderColors[phase]}` }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
