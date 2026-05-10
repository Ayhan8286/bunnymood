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

export const askGroqJSON = async (messages: GroqMessage[]): Promise<any> => {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      model: MODEL, 
      messages, 
      max_tokens: 1500, 
      temperature: 0.7,
      response_format: { type: "json_object" }
    }),
  });
  if (!res.ok) throw new Error('Groq error');
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
};

// ─── Daily localStorage cache ─────────────────────────────────
const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = () => getLocalDateString();

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

// Removed dailyCached as we now use lsGet/lsSet directly in getDailyAIProfile

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
    
    // Support multiple moods stored as "Happy, Calm"
    const moodList = log.mood.split(',').map(m => m.trim()).filter(Boolean);
    moodList.forEach(m => {
      byMonth[month].moods[m] = (byMonth[month].moods[m] ?? 0) + 1;
    });
    
    log.symptoms.forEach(s => byMonth[month].symptoms.add(s));
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a)) // show newest months first
    .map(([month, data]) => {
      const moodStr = Object.entries(data.moods)
        .sort((a, b) => b[1] - a[1])
        .map(([m, c]) => `${m}×${c}`)
        .join(', ');
      const symStr = [...data.symptoms].slice(0, 6).join(', ');
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
    const cutoffStr = getLocalDateString(cutoff);

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
  lines.push(``, `=== BOYFRIEND'S NOTES (written BY HER BOYFRIEND — all ${ctx.husbandJournals.length} entries) ===`);
  if (ctx.husbandJournals.length === 0) {
    lines.push(`[no notes yet]`);
  } else {
    ctx.husbandJournals.forEach(j => lines.push(`${j.date}: ${j.content}`));
  }

  return lines.join('\n');
};

// ─── Shared system rules ──────────────────────────────────────
const BASE_RULES = `
You are Bunny 🐰, a warm, non-judgmental, deeply caring companion for a young couple (boyfriend & girlfriend) tracking her cycle.
They call each other "wifey" and "hubby" as pet names but they are NOT married — they are in a committed relationship.
You have access to private journal data shared by both partners.

HOW TO USE JOURNAL DATA:
- Read and understand the emotional context from journals
- Use insights from journals to personalize your response
- Do NOT quote journal entries word-for-word
- Synthesize themes gently — e.g. "you seem to be craving closeness" not quoting what they wrote
- Treat ALL topics (including intimacy and desire) with warmth, zero judgment, and sensitivity
- Intimacy during menstruation is natural and valid — address it compassionately if relevant
- Give dating advice like a best friend who truly understands relationships

FORMAT: 2-4 sentences unless instructed otherwise. Warm, soft tone. Use "babe", "love" casually.
`;

// ─── 1. Phase insight ─────────────────────────────────────────
export interface DailyAIProfile {
  husbandTip: string;
  wifeTip: string;
}

export const getDailyAIProfile = async (ctx: UserContext): Promise<DailyAIProfile> => {
  // We use cycleDay, phase, and the latest mood/symptom length as cache invalidators
  const key = `relationship-${ctx.phase}-${ctx.cycleDay}-${ctx.allMoodLogs[0]?.mood ?? 'x'}-${ctx.allMoodLogs[0]?.symptoms?.length ?? 0}-${ctx.personalJournals.length}-${ctx.husbandJournals.length}`;
  
  const rawCache = lsGet(key);
  if (rawCache) {
    try {
      return JSON.parse(rawCache) as DailyAIProfile;
    } catch {} // if parsing fails, fetch again
  }


  
  const SYSTEM_PROMPT = `
${BASE_RULES}
You must return a SINGLE JSON object containing everything needed for her daily dashboard.
IMPORTANT: You MUST return strictly valid JSON.

JSON Schema required:
{
  "husbandTip": "Dating advice for the BOYFRIEND. Tell him exactly what to do or say today to make his girl feel special and loved — like a best friend giving him real relationship coaching. Reference her current phase and emotional themes from both journals. Be specific, not generic. (3-4 sentences)",
  "wifeTip": "Situational relationship advice for the GIRLFRIEND. Help her understand what her boyfriend is going through based on his notes. Guide her on how to respond with love and clarity. Be her supportive best friend. (3-4 sentences)"
}

Rules for JSON payload:
- Ensure all quotes are properly escaped.
- Do NOT include any markdown blocks around the JSON.
- Synthesize journal themes. Do not quote verbatim.
`;

  const data = await askGroqJSON([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Her data:\n${buildContext(ctx)}\n\nGenerate the complete JSON DailyAIProfile.` }
  ]);

  lsSet(key, JSON.stringify(data));
  return {
    husbandTip: data.husbandTip || "Bunny is thinking of something sweet for you... 🐰",
    wifeTip: data.wifeTip || "Bunny is reading his notes to guide you... 🌸"
  };
};
