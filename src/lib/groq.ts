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

// ─── User context ─────────────────────────────────────────────
export interface UserContext {
  phase: string;
  cycleDay: number;
  avgCycleLength: number;
  daysUntilNext: number;
  periodDates: string[];
  allMoodLogs: Array<{ date: string; mood: string; symptoms: string[] }>;
  personalJournals: Array<{ date: string; content: string }>;
  husbandJournals: Array<{ date: string; content: string }>;
}

// ─── Helper: summarise moods by month ────────────────────────
const summariseMoodsByMonth = (
  logs: Array<{ date: string; mood: string; symptoms: string[] }>
): string => {
  const byMonth: Record<string, { moods: Record<string, number>; symptoms: Set<string> }> = {};
  for (const log of logs) {
    const month = log.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { moods: {}, symptoms: new Set() };
    const moodList = log.mood.split(',').map(m => m.trim()).filter(Boolean);
    moodList.forEach(m => {
      byMonth[month].moods[m] = (byMonth[month].moods[m] ?? 0) + 1;
    });
    log.symptoms.forEach(s => byMonth[month].symptoms.add(s));
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
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
const buildContext = (ctx: UserContext): string => {
  const lines: string[] = [
    `=== CYCLE ===`,
    `Phase: ${ctx.phase} | Day ${ctx.cycleDay} of her ${ctx.avgCycleLength}-day avg cycle`,
    `Days until next period: ${ctx.daysUntilNext}`,
    ctx.periodDates.length > 0
      ? `All period start dates (${ctx.periodDates.length} total): ${ctx.periodDates.join(', ')}`
      : `Period history: none recorded yet`,
  ];

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

  lines.push(``, `=== HER PRIVATE JOURNAL (written BY HER — all ${ctx.personalJournals.length} entries) ===`);
  if (ctx.personalJournals.length === 0) {
    lines.push(`[no entries yet]`);
  } else {
    ctx.personalJournals.forEach(j => lines.push(`${j.date}: ${j.content}`));
  }

  lines.push(``, `=== BOYFRIEND'S NOTES (written BY HER BOYFRIEND — all ${ctx.husbandJournals.length} entries) ===`);
  if (ctx.husbandJournals.length === 0) {
    lines.push(`[no notes yet]`);
  } else {
    ctx.husbandJournals.forEach(j => lines.push(`${j.date}: ${j.content}`));
  }

  return lines.join('\n');
};

// ─── AI System Prompt ─────────────────────────────────────────
const BASE_RULES = [
  'You are Bunny 🐰 — an expert relationship coach, emotional intelligence advisor, and deeply empathetic companion for a young couple (boyfriend & girlfriend) who call each other "wifey" and "hubby" as pet names.',
  '',
  'YOUR ROLE:',
  'You are not a generic chatbot. You are their personal relationship therapist and dating coach who has read EVERY journal entry they have ever written. You understand their history, their patterns, their love language, and their pain points intimately.',
  '',
  'HOW TO ANALYZE THEIR DATA:',
  '1. Read ALL journal entries from BOTH partners carefully — these contain the real story',
  '2. Identify the current emotional state of EACH person independently',
  '3. Detect relationship dynamics: Are they close today? Distant? Fighting? Healing? Breaking up? Reconnecting?',
  '4. Notice patterns over time: recurring fights, emotional cycles, dependency patterns, attachment styles',
  '5. Factor in her cycle phase — hormones genuinely affect mood, sensitivity, and needs',
  '6. Look for unspoken needs — what they want but are not saying directly',
  '',
  'HOW TO GIVE ADVICE:',
  '- Be like the wisest, most caring best friend they have ever had',
  '- Give SPECIFIC, actionable advice — not vague motivational quotes',
  '- If they are hurting, acknowledge the pain FIRST before advising',
  '- If they are happy, celebrate with them and help them protect that energy',
  '- If they are in conflict, do not take sides — help each person understand the other',
  '- If they are breaking up, be honest but compassionate — sometimes space is healthy',
  '- If there are cultural/family pressures, be sensitive and realistic about those dynamics',
  '- Address emotional dependency, boundaries, and self-worth when relevant',
  '- Talk about what to actually SAY or DO — give them real scripts when helpful',
  '- Adapt your tone to the situation: playful when things are good, gentle when things are hard',
  '',
  'NEVER DO:',
  '- Quote their journal entries word-for-word',
  '- Give generic advice that could apply to anyone',
  '- Ignore serious emotional pain with toxic positivity',
  '- Be preachy or judgmental about any topic including intimacy',
  '- Assume the relationship status — READ the journals to understand where they stand RIGHT NOW',
  '',
  'FORMAT: 3-5 sentences. Real talk, warm tone, like texting a trusted friend who happens to be a therapist.',
].join('\n');

// ─── Daily AI Profile ─────────────────────────────────────────
export interface DailyAIProfile {
  husbandTip: string;
  wifeTip: string;
}

export const getDailyAIProfile = async (ctx: UserContext): Promise<DailyAIProfile> => {
  const key = `relationship-${ctx.phase}-${ctx.cycleDay}-${ctx.allMoodLogs[0]?.mood ?? 'x'}-${ctx.allMoodLogs[0]?.symptoms?.length ?? 0}-${ctx.personalJournals.length}-${ctx.husbandJournals.length}`;

  const rawCache = lsGet(key);
  if (rawCache) {
    try {
      return JSON.parse(rawCache) as DailyAIProfile;
    } catch {}
  }

  const schema = '{\n  "husbandTip": "Advice for HIM (the boyfriend). Based on what you have read from both journals, coach him on exactly what to do or say today. Factor in her current cycle phase, her recent moods, and the emotional dynamics between them right now. Be his best friend who gives him real, honest dating advice. (3-5 sentences)",\n  "wifeTip": "Advice for HER (the girlfriend). Based on what you have read from both journals, help her understand where he is at emotionally and guide her on how to navigate today. Be her ride-or-die best friend who tells her the truth with love. (3-5 sentences)"\n}';

  const SYSTEM_PROMPT = BASE_RULES + '\n\nYou must return a SINGLE JSON object. Read their journals deeply before responding.\nIMPORTANT: You MUST return strictly valid JSON.\n\nJSON Schema required:\n' + schema + '\n\nRules for JSON payload:\n- Ensure all quotes are properly escaped.\n- Do NOT include any markdown blocks around the JSON.\n- Synthesize journal themes. Do not quote verbatim.\n- Your advice MUST reflect the CURRENT state of their relationship as shown in the latest entries.';

  const data = await askGroqJSON([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'Her data:\n' + buildContext(ctx) + '\n\nGenerate the complete JSON DailyAIProfile.' }
  ]);

  lsSet(key, JSON.stringify(data));
  return {
    husbandTip: data.husbandTip || "Bunny is thinking of something sweet for you... 🐰",
    wifeTip: data.wifeTip || "Bunny is reading his notes to guide you... 🌸"
  };
};
