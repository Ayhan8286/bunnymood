import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { supabase } from './lib/supabase';
import { getSession, clearSession, type AuthUser } from './lib/auth';
import { calculateCycleStats, type PeriodEntry, type PredictionResult } from './utils/cycleEngine';
import type { UserContext, DailyAIProfile } from './lib/groq';
import { clearAICache, getDailyAIProfile } from './lib/groq';
import Dashboard from './components/Dashboard';
import SupportView from './components/SupportView';
import WifeySupportView from './components/WifeySupportView';
import BulkPeriodLog from './components/BulkPeriodLog';
import MoodPicker from './components/MoodPicker';
import LoginPage from './components/LoginPage';
import JournalSheet from './components/JournalSheet';
import JournalCard from './components/JournalCard';
import Calendar from './components/Calendar';
import AnimatedBackground from './components/AnimatedBackground';
import { Home, BookOpen, Heart, LogOut, Trash2 } from 'lucide-react';
import MonitoringSystem from './components/MonitoringSystem';


const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const [user, setUser] = useState<AuthUser | null>(getSession());
  const [entries, setEntries] = useState<PeriodEntry[]>([]);
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [stats, setStats] = useState<PredictionResult | null>(null);
  const [aiProfile, setAiProfile] = useState<DailyAIProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null); // id being deleted

  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [journalType, setJournalType] = useState<'personal' | 'husband' | null>(null);

  const fetchData = useCallback(async (userName: string) => {
    setLoading(true);
    try {
      const [{ data: pd }, { data: md }, { data: jd }] = await Promise.all([
        supabase.from('period_entries').select('*').eq('user_name', userName).order('start_date', { ascending: false }),
        supabase.from('mood_logs').select('*').eq('user_name', userName).order('log_date', { ascending: false }),
        supabase.from('journals').select('*').eq('user_name', userName).order('created_at', { ascending: false }),
      ]);
      if (pd) {
        const parsed: PeriodEntry[] = pd.map((r: any) => ({
          id: r.id, startDate: new Date(r.start_date + 'T00:00:00'), duration: r.duration,
        }));
        setEntries(parsed);
        setStats(calculateCycleStats(parsed));
      }
      if (md) setMoodLogs(md);
      if (jd) setJournals(jd);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData(user.name);
    else setLoading(false);
  }, [user, fetchData]);

  // ─── Add ──────────────────────────────────────────────────────
  const handleAddEntries = async (newEntries: PeriodEntry[]) => {
    if (!user) return;
    await supabase.from('period_entries').insert(
      newEntries.map(e => ({ user_name: user.name, start_date: getLocalDateString(e.startDate), duration: e.duration }))
    );
    const updated = [...newEntries, ...entries].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    setEntries(updated);
    setStats(calculateCycleStats(updated));
  };

  const handleAddMood = async (moods: string[], symptoms: string[]) => {
    if (!user) return;
    const today = getLocalDateString();
    const moodStr = moods.join(', ');
    await supabase.from('mood_logs').upsert(
      { user_name: user.name, log_date: today, mood: moodStr, symptoms },
      { onConflict: 'user_name,log_date' }
    );
    setMoodLogs(prev => [
      { id: crypto.randomUUID(), user_name: user.name, log_date: today, mood: moodStr, symptoms },
      ...prev.filter(l => l.log_date !== today),
    ]);
  };

  const handleAddJournal = async (type: 'personal' | 'husband', content: string) => {
    if (!user) return;
    const today = getLocalDateString();
    const { data } = await supabase.from('journals')
      .insert({ user_name: user.name, journal_date: today, entry_type: type, content })
      .select().single();
    if (data) setJournals(prev => [data, ...prev]);
  };

  // ─── Delete ───────────────────────────────────────────────────
  const deletePeriod = async (id: string) => {
    setDeleting(id);
    await supabase.from('period_entries').delete().eq('id', id);
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    setStats(calculateCycleStats(updated));
    clearAICache(); // deleted data must not be seen by AI
    setDeleting(null);
  };

  const deleteMood = async (id: string) => {
    setDeleting(id);
    await supabase.from('mood_logs').delete().eq('id', id);
    setMoodLogs(prev => prev.filter(l => l.id !== id));
    clearAICache();
    setDeleting(null);
  };

  const deleteJournal = async (id: string) => {
    setDeleting(id);
    await supabase.from('journals').delete().eq('id', id);
    setJournals(prev => prev.filter(j => j.id !== id));
    clearAICache();
    setDeleting(null);
  };

  // ─── Context ──────────────────────────────────────────────────
  const buildCtx = (): UserContext => ({
    phase: stats?.currentPhase ?? 'Follicular',
    cycleDay: stats?.cycleDay ?? 1,
    avgCycleLength: stats?.averageCycleLength ?? 28,
    daysUntilNext: stats?.daysUntilNext ?? 0,
    periodDates: entries.map(e => getLocalDateString(e.startDate)),
    allMoodLogs: moodLogs.map(l => ({ date: l.log_date, mood: l.mood, symptoms: l.symptoms ?? [] })),
    personalJournals: journals.filter(j => j.entry_type === 'personal').map(j => ({ date: j.journal_date, content: j.content })),
    husbandJournals: journals.filter(j => j.entry_type === 'husband').map(j => ({ date: j.journal_date, content: j.content })),
  });

  useEffect(() => {
    if (!stats || !user || loading) return;
    getDailyAIProfile(buildCtx())
      .then(p => setAiProfile(p))
      .catch(e => console.error('AI Profile fetch error:', e));
  }, [stats, moodLogs, journals, user, loading]);

  const moodEmoji: Record<string, string> = {
    Happy: '😊', Calm: '😌', Sad: '😔', Energetic: '⚡',
    Tired: '😴', Sensitive: '🥺', Irritated: '😤', Loved: '🥰',
    Anxious: '🤔', Peaceful: '🧘', Overwhelmed: '🫠', Excited: '🤩',
    Bored: '🥱', Social: '💃', Romantic: '🕯️', Reflective: '🌙',
  };
  const getMoodEmoji = (moodStr: string) => {
    const primary = moodStr.split(',')[0].trim();
    return moodEmoji[primary] ?? '💭';
  };
  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtFull = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const today = getLocalDateString();
  const todayMood = moodLogs.find(l => l.log_date === today);
  const displayName = user ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : '';

  // Delete button style
  const delBtn = (id: string) => ({
    padding: '0.3rem',
    background: 'none', boxShadow: 'none', border: 'none',
    lineHeight: 0, borderRadius: '50%', cursor: 'pointer',
    opacity: deleting === id ? 0.4 : 0.55,
    transition: 'opacity 0.15s',
    flexShrink: 0 as const,
  });

  if (!user) return <LoginPage onLogin={u => setUser(u)} />;
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'linear-gradient(160deg,#fff0f5,#f8e8ff)' }}>
      <div style={{ fontSize: '3.5rem' }} className="animate-float">🐰</div>
      <p style={{ color: 'var(--rose-dark)', fontWeight: 700, fontFamily: 'Pacifico,cursive' }}>loading your space…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      <AnimatedBackground />

      {/* Sticky header */}
      <header className="flex-between" style={{ padding: '0.8rem 1rem', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,251,253,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,192,210,0.18)' }}>
        <h1 style={{ fontFamily: 'Pacifico,cursive', fontSize: '1.42rem', color: 'var(--rose-dark)', fontWeight: 400 }}>
          BunnyMood 🐰
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>hi, {displayName} 💕</span>
          <button onClick={() => { clearSession(); setUser(null); }} className="ghost"
            style={{ padding: '0.32rem 0.65rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <LogOut size={12} /> bye~
          </button>
        </div>
      </header>

      {/* Page */}
      <div className="page-wrap" style={{ padding: '1.1rem 1rem 90px', position: 'relative', zIndex: 1 }}>
        <style>{`@media(min-width:768px){.page-wrap{padding:1.4rem 1.5rem 1.5rem 92px!important}}`}</style>

        {/* ═══ HOME ══════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="home-grid animate-in">
            {/* Col 1 — Cycle dashboard */}
            <div className="home-col-left">
              <MonitoringSystem userName={user.name} />
              <Dashboard stats={stats} onOpenLog={() => setIsLogOpen(true)} />
              <Calendar stats={stats} />
            </div>

            {/* Col 2 — Mood + Support */}
            <div className="home-col-right">
              <div className="card" style={{ textAlign: 'center', padding: '1rem 1.2rem' }}>
                <p style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.55rem' }}>
                  Today's mood
                </p>
                <button onClick={() => setIsMoodOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.68rem 1.35rem', fontSize: '0.87rem' }}>
                  <Heart size={15} /> How I feel today
                </button>
                {todayMood && (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.78rem', marginTop: '0.5rem', fontWeight: 600 }}>
                    {getMoodEmoji(todayMood.mood)} {todayMood.mood}
                    {todayMood.symptoms?.length > 0 && ` · ${todayMood.symptoms.slice(0, 3).join(', ')}`}
                  </p>
                )}
              </div>

              <SupportView stats={stats} tip={aiProfile?.husbandTip} />
              <WifeySupportView stats={stats} tip={aiProfile?.wifeTip} />
            </div>

            {/* Col 3 — Journal */}
            <div className="home-col-journal">
              <JournalCard journals={journals} onWrite={t => setJournalType(t)} />
            </div>
          </div>
        )}

        {/* ═══ HISTORY ═══════════════════════════ */}
        {activeTab === 'history' && (
          <div className="history-grid animate-in">

            {/* Period history */}
            <div className="card">
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--rose-dark)', fontSize: '0.95rem' }}>🌸 Period History</h3>
                <button onClick={() => setIsLogOpen(true)} className="ghost"
                  style={{ fontSize: '0.72rem', padding: '0.32rem 0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  + Add
                </button>
              </div>
              {entries.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '1.5rem 0' }}>No entries yet 💕</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.48rem' }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.8rem', background: 'linear-gradient(90deg,#fff0f5,#fff8fb)', borderRadius: 14, border: '1.5px solid var(--rose-light)' }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>🩸</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.86rem' }}>{fmtFull(getLocalDateString(e.startDate))}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.duration} days</p>
                      </div>
                      <button
                        onClick={() => deletePeriod(e.id)}
                        disabled={deleting === e.id}
                        style={delBtn(e.id)}
                        title="Delete"
                      >
                        <Trash2 size={15} color="var(--rose-dark)" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mood log */}
            <div className="card">
              <h3 style={{ color: 'var(--rose-dark)', fontSize: '0.95rem', marginBottom: '1rem' }}>💭 Mood Log</h3>
              {moodLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '1.5rem 0' }}>No mood logs yet 🌸</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.48rem' }}>
                  {moodLogs.map(log => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.8rem', background: 'linear-gradient(90deg,#f8f0ff,#fff8fb)', borderRadius: 14, border: '1.5px solid var(--lavender)' }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{getMoodEmoji(log.mood)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.86rem' }}>{fmtDate(log.log_date)} — {log.mood}</p>
                        {log.symptoms?.length > 0 && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.symptoms.slice(0, 4).join(', ')}</p>
                        )}
                      </div>
                      <button onClick={() => deleteMood(log.id)} disabled={deleting === log.id} style={delBtn(log.id)} title="Delete">
                        <Trash2 size={15} color="var(--lavender-dark)" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Her journal */}
            <div className="card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--rose-dark)' }}>📖 Her Journal</h3>
              {journals.filter(j => j.entry_type === 'personal').length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '1.5rem 0' }}>No entries yet 🌸</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.48rem' }}>
                  {journals.filter(j => j.entry_type === 'personal').map(j => (
                    <div key={j.id} style={{ padding: '0.65rem 0.8rem', background: 'linear-gradient(90deg,#fff0f5,#fff8fb)', borderRadius: 14, border: '1.5px solid var(--rose-light)' }}>
                      <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--rose-dark)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{fmtDate(j.journal_date)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{new Date(j.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          <button onClick={() => deleteJournal(j.id)} disabled={deleting === j.id} style={delBtn(j.id)} title="Delete">
                            <Trash2 size={13} color="var(--rose-dark)" />
                          </button>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text)', fontSize: '0.84rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{j.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Husband journal */}
            <div className="card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--lavender-dark)' }}>💌 Husband's Notes</h3>
              {journals.filter(j => j.entry_type === 'husband').length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '1.5rem 0' }}>No notes yet 💌</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.48rem' }}>
                  {journals.filter(j => j.entry_type === 'husband').map(j => (
                    <div key={j.id} style={{ padding: '0.65rem 0.8rem', background: 'linear-gradient(90deg,#f5f0ff,#faf0ff)', borderRadius: 14, border: '1.5px solid var(--lavender)' }}>
                      <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--lavender-dark)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{fmtDate(j.journal_date)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{new Date(j.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          <button onClick={() => deleteJournal(j.id)} disabled={deleting === j.id} style={delBtn(j.id)} title="Delete">
                            <Trash2 size={13} color="var(--lavender-dark)" />
                          </button>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text)', fontSize: '0.84rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{j.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="bottom-nav">
        <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={20} /> home
        </button>
        <button
          onClick={() => setIsMoodOpen(true)}
          className="animate-pulse"
          style={{ background: 'linear-gradient(135deg,var(--rose),var(--rose-dark))', color: 'white', borderRadius: '50%', padding: '0.7rem', boxShadow: 'var(--shadow-pink)', width: 50, height: 50, lineHeight: 0 }}
        >
          <Heart size={21} />
        </button>
        <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <BookOpen size={20} /> history
        </button>
      </nav>

      {isLogOpen && <BulkPeriodLog onSave={handleAddEntries} onClose={() => setIsLogOpen(false)} />}
      {isMoodOpen && <MoodPicker onSave={handleAddMood} onClose={() => setIsMoodOpen(false)} />}
      {journalType && (
        <JournalSheet type={journalType} userName={user.name} onSave={handleAddJournal} onClose={() => setJournalType(null)} />
      )}
    </div>
  );
}

export default App;
