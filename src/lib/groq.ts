const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const askGroq = async (messages: GroqMessage[]): Promise<string> => {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 340, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error('Groq error');
  const data = await res.json();
  return data.choices[0].message.content as string;
};

// ─── Daily localStorage cache ─────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const lsGet = (key: string): string | null => {
  try {
    const raw = localStorage.getItem(`bunny_ai_${key}`);
    if (!raw) return null;
    const { date, text } = JSON.parse(raw);
    if (date !== today()) { localStorage.removeItem(`bunny_ai_${key}`); return null; }
    return text;
  } catch { return null; }
};

const lsSet = (key: string, text: string) => {
  try { localStorage.setItem(`bunny_ai_${key}`, JSON.stringify({ date: today(), text })); } catch {}
};

/**
 * Call this whenever the user deletes any data (period entry, mood log, journal).
 * Wipes all cached AI responses so the next render fetches fresh ones
 * that reflect the deletion. Deleted data is gone — AI won't see it.
 */
export const clearAICache = () => {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('bunny_ai_'))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
};

const dailyCached = async (key: string, fn: () => Promise<string>): Promise<string> => {
  const ls = lsGet(key);
  if (ls) return ls;
  const text = await fn();
  lsSet(key, text);
  return text;
};

// ─── User context ─────────────────────────────────────────────
export interface UserContext {
  phase: string;
  cycleDay: number;
  avgCycleLength: number;
  daysUntilNext: number;
  // ALL period dates — always compact (just date strings)
  periodDates: string[];
  // ALL mood logs — full objects so we can compress intelligently
  allMoodLogs: Array<{ date: string; mood: string; symptoms: string[] }>;
  // ALL journals — critical signal, kept in full (200 char max each)
  personalJournals: Array<{ date: string; content: string }>;
  husbandJournals: Array<{ date: string; content: string }>;
}

// ─── Helper: summarise moods by month ────────────────────────
const summariseMoodsByMonth = (
  logs: Array<{ date: string; mood: string; symptoms: string[] }>
): string => {
  const byMonth: Record<string, { moods: Record<string, number>; symptoms: Set<string> }> = {};
  for (const log of logs) {
    const month = log.date.slice(0, 7); // YYYY-MM
    if (!byMonth[month]) byMonth[month] = { moods: {}, symptoms: new Set() };
    byMonth[month].moods[log.mood] = (byMonth[month].moods[log.mood] ?? 0) + 1;
    log.symptoms.forEach(s => byMonth[month].symptoms.add(s));
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const moodStr = Object.entries(data.moods)
        .sort((a, b) => b[1] - a[1])
        .map(([m, c]) => `${m}×${c}`)
        .join(', ');
      const symStr = [...data.symptoms].slice(0, 4).join(', ');
      return `${month}: ${moodStr}${symStr ? ` | symptoms: ${symStr}` : ''}`;
    })
    .join('\n');
};

// ─── Build full context from ALL user data ────────────────────
// Strategy:
//   Periods   → all dates (very compact)
//   Moods     → last 21 days in full detail + older data summarised by month
//   Journals  → all entries in full (max 200 chars each, highest signal)
const buildContext = (ctx: UserContext): string => {
  const lines: string[] = [
    `=== CYCLE ===`,
    `Phase: ${ctx.phase} | Day ${ctx.cycleDay} of her ${ctx.avgCycleLength}-day avg cycle`,
    `Days until next period: ${ctx.daysUntilNext}`,
    ctx.periodDates.length > 0
      ? `All period start dates (${ctx.periodDates.length} total): ${ctx.periodDates.join(', ')}`
      : `Period history: none recorded yet`,
  ];

  // ── Moods ──────────────────────────────────────────────────
  lines.push(``, `=== MOOD LOG (all entries, written by her) ===`);
  if (ctx.allMoodLogs.length === 0) {
    lines.push(`- No moods logged yet`);
  } else {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 21);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const recent = ctx.allMoodLogs.filter(l => l.date >= cutoffStr);
    const older  = ctx.allMoodLogs.filter(l => l.date < cutoffStr);

    if (recent.length > 0) {
      lines.push(`-- Last 21 days (full detail) --`);
      recent.forEach(l => {
        const syms = l.symptoms.length > 0 ? ` | ${l.symptoms.join(', ')}` : '';
        lines.push(`${l.date}: ${l.mood}${syms}`);
      });
    }
    if (older.length > 0) {
      lines.push(`-- Older moods (monthly summary, ${older.length} entries) --`);
      lines.push(summariseMoodsByMonth(older));
    }
  }

  // ── Her journal ────────────────────────────────────────────
  lines.push(``, `=== HER PRIVATE JOURNAL (written BY HER — all ${ctx.personalJournals.length} entries) ===`);
  if (ctx.personalJournals.length === 0) {
    lines.push(`[no entries yet]`);
  } else {
    ctx.personalJournals.forEach(j => lines.push(`${j.date}: ${j.content}`));
  }

  // ── Husband notes ──────────────────────────────────────────
  lines.push(``, `=== HUSBAND'S NOTES (written BY HER HUSBAND — all ${ctx.husbandJournals.length} entries) ===`);
  if (ctx.husbandJournals.length === 0) {
    lines.push(`[no notes yet]`);
  } else {
    ctx.husbandJournals.forEach(j => lines.push(`${j.date}: ${j.content}`));
  }

  return lines.join('\n');
};

// ─── Shared system rules ──────────────────────────────────────
const BASE_RULES = `
You are Bunny 🐰, a warm, non-judgmental, deeply caring companion for a woman and her husband tracking her cycle.
You have access to private journal data shared by both partners.

HOW TO USE JOURNAL DATA:
- Read and understand the emotional context from journals
- Use insights from journals to personalize your response
- Do NOT quote journal entries word-for-word
- Synthesize themes gently — e.g. "you seem to be craving closeness" not quoting what they wrote
- Treat ALL topics (including intimacy and desire) with warmth, zero judgment, and sensitivity
- Intimacy during menstruation is natural and valid — address it compassionately if relevant

FORMAT: 2-4 sentences unless instructed otherwise. Warm, soft tone.
`;

// ─── 1. Phase insight ─────────────────────────────────────────
export const getPhaseInsight = async (ctx: UserContext): Promise<string> => {
  const key = `insight-${ctx.phase}-${ctx.cycleDay}-${ctx.allMoodLogs[0]?.mood ?? 'x'}`;
  return dailyCached(key, () => askGroq([
    { role: 'system', content: BASE_RULES },
    {
      role: 'user',
      content: `Her data:\n${buildContext(ctx)}\n\nGive her a warm, personalised message for today based on her phase, mood signals, and any emotional themes from her journal. Be gentle and personal.`,
    },
  ]));
};

// ─── 2. Calming message ────────────────────────────────────────
export const getCalmingMessage = async (ctx: UserContext): Promise<string> => {
  const latest = ctx.allMoodLogs[0]?.mood ?? null;
  return askGroq([
    { role: 'system', content: BASE_RULES },
    {
      role: 'user',
      content: `Her data:\n${buildContext(ctx)}\n\n${latest ? `Her latest mood: ${latest}.` : ''} Give her a calming, loving message that acknowledges any emotional themes she's experiencing.`,
    },
  ]);
};

// ─── 3. Husband tip ────────────────────────────────────────────
export const getHusbandTip = async (ctx: UserContext): Promise<string> => {
  const key = `husband-${ctx.phase}-${ctx.cycleDay}-${ctx.allMoodLogs[0]?.mood ?? 'x'}`;
  return dailyCached(key, () => askGroq([
    {
      role: 'system',
      content: `${BASE_RULES}
You are advising the HUSBAND specifically.
If the journals suggest she's expressing desire or wanting intimacy (even during her period), guide him warmly — 
"she may be wanting closeness right now" type of guidance. Gentle, tasteful, never explicit.`,
    },
    {
      role: 'user',
      content: `Data:\n${buildContext(ctx)}\n\nWhat should the husband do or say today to make her feel loved and understood? Use insights from journals if available.`,
    },
  ]));
};

// ─── 4. Pattern analysis ──────────────────────────────────────
export const analyzePatterns = async (ctx: UserContext): Promise<string> => {
  const hasData = ctx.allMoodLogs.length > 0
    || ctx.periodDates.length >= 2
    || ctx.personalJournals.length > 0
    || ctx.husbandJournals.length > 0;

  if (!hasData) {
    return 'Not enough data yet 🐰 Keep logging your moods and feelings — I\'ll start finding patterns soon! 🌸';
  }

  return askGroq([
    {
      role: 'system',
      content: `${BASE_RULES}
You are analyzing patterns in her cycle, moods, symptoms, and emotional themes.
Use ALL available data — cycle dates, moods, symptoms, AND journal themes.
Identify real patterns: emotional patterns, physical patterns, desires, needs.
Be warm, insightful, and personal. Do NOT quote journals verbatim.
Synthesize themes — e.g. "you seem to crave emotional closeness during this phase".
3-4 sentences. Be specific to her actual data, not generic.`,
    },
    {
      role: 'user',
      content: `Her data:\n${buildContext(ctx)}\n\nWhat meaningful patterns do you notice across her cycle, moods, and emotional themes? Be specific and insightful.`,
    },
  ]);
};

// ─── 5. AI Phase Guide — personalised daily ───────────────────
export const getAIPhaseGuide = async (ctx: UserContext, view: 'her' | 'husband'): Promise<string> => {
  const key = `guide-${view}-${ctx.phase}-${ctx.cycleDay}-${ctx.allMoodLogs[0]?.mood ?? 'x'}-${ctx.allMoodLogs[0]?.symptoms?.length ?? 0}`;

  const systemHer = `${BASE_RULES}
Generate a personalised self-care guide for her based on her phase, current mood/symptoms, and emotional themes from her journal.
Give 4-5 practical actions for TODAY. Format as a list, one per line, starting with a relevant emoji.
If journals suggest specific needs (like intimacy or emotional connection), address them sensitively in her self-care.`;

  const systemHusband = `${BASE_RULES}
Generate a personalised guide for the HUSBAND for today.
Give 4-5 specific, actionable things he can do based on her phase, mood signals, and what her journal themes suggest she needs.
Format as a list, one per line, starting with a relevant emoji.
If she's expressed desire for intimacy or closeness in her journal (even during her period), gently include that as one point — tastefully worded.`;

  return dailyCached(key, () => askGroq([
    { role: 'system', content: view === 'her' ? systemHer : systemHusband },
    {
      role: 'user',
      content: `Her data:\n${buildContext(ctx)}\n\nGenerate today's personalised guide for ${view === 'her' ? 'her' : 'her husband'}.`,
    },
  ]));
};
