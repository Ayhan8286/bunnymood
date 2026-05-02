import { addDays, differenceInDays, startOfDay, subDays } from 'date-fns';

export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';

export interface PeriodEntry {
  id: string;
  startDate: Date;
  endDate?: Date;
  duration: number;
}

export interface PhaseRange {
  phase: CyclePhase;
  start: Date;
  end: Date;
  daysUntilStart: number; // negative = already started, positive = upcoming
  daysUntilEnd: number;
  isActive: boolean;
}

export interface PredictionResult {
  nextPeriodDate: Date;
  ovulationDate: Date;
  fertileWindow: { start: Date; end: Date };
  currentPhase: CyclePhase;
  daysUntilNext: number;
  averageCycleLength: number;
  cycleDay: number;
  progress: number;
  phases: PhaseRange[]; // all 4 phases with dates
}

export const calculateCycleStats = (entries: PeriodEntry[]): PredictionResult | null => {
  if (entries.length === 0) return null;

  const sortedEntries = [...entries].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  const lastEntry = sortedEntries[0];
  const lastStartDate = startOfDay(new Date(lastEntry.startDate));

  // Average cycle length
  let averageCycleLength = 28;
  if (sortedEntries.length >= 2) {
    let totalDays = 0;
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      totalDays += Math.abs(differenceInDays(sortedEntries[i].startDate, sortedEntries[i + 1].startDate));
    }
    averageCycleLength = Math.round(totalDays / (sortedEntries.length - 1));
  }

  const today = startOfDay(new Date());
  const duration = lastEntry.duration || 5;

  const nextPeriodDate = addDays(lastStartDate, averageCycleLength);
  const daysUntilNext = differenceInDays(nextPeriodDate, today);
  const ovulationDate = subDays(nextPeriodDate, 14);
  const fertileWindow = {
    start: subDays(ovulationDate, 5),
    end: addDays(ovulationDate, 1),
  };

  // Cycle day
  const rawDay = differenceInDays(today, lastStartDate);
  const cycleDay = (rawDay % averageCycleLength) + 1;
  const progress = Math.min((cycleDay - 1) / averageCycleLength, 1);

  // ─── Calculate all 4 phase date ranges ───────────────────────────────────
  // Menstrual: day 1 → day duration
  const menstrualStart = lastStartDate;
  const menstrualEnd   = addDays(lastStartDate, duration - 1);

  // Follicular: day after menstrual → day before fertile window
  const follicularStart = addDays(menstrualEnd, 1);
  const follicularEnd   = subDays(fertileWindow.start, 1);

  // Ovulation (fertile window): fertileWindow.start → fertileWindow.end
  const ovulationStart = fertileWindow.start;
  const ovulationEnd   = fertileWindow.end;

  // Luteal: day after fertile window → day before next period
  const lutealStart = addDays(ovulationEnd, 1);
  const lutealEnd   = subDays(nextPeriodDate, 1);

  const makeRange = (phase: CyclePhase, start: Date, end: Date): PhaseRange => ({
    phase,
    start,
    end,
    daysUntilStart: differenceInDays(start, today),
    daysUntilEnd: differenceInDays(end, today),
    isActive: today >= start && today <= end,
  });

  const phases: PhaseRange[] = [
    makeRange('Menstrual', menstrualStart, menstrualEnd),
    makeRange('Follicular', follicularStart, follicularEnd),
    makeRange('Ovulation', ovulationStart, ovulationEnd),
    makeRange('Luteal', lutealStart, lutealEnd),
  ];

  // Current phase
  let currentPhase: CyclePhase = phases.find(p => p.isActive)?.phase ?? 'Follicular';

  return {
    nextPeriodDate,
    ovulationDate,
    fertileWindow,
    currentPhase,
    daysUntilNext,
    averageCycleLength,
    cycleDay,
    progress,
    phases,
  };
};

export const getPhaseDescription = (phase: CyclePhase): string => {
  switch (phase) {
    case 'Menstrual':
      return "Your body is doing something incredible right now. Rest, recharge, and be gentle with yourself today. You deserve all the comfort. 🌸";
    case 'Follicular':
      return "Energy is rising and creativity is blooming! This is a wonderful time for new ideas, social plans, and doing things that excite you. 🌱";
    case 'Ovulation':
      return "You're absolutely glowing right now! Your confidence and energy are at their peak. This is your time to shine. ✨";
    case 'Luteal':
      return "The cozy nesting phase. Your body is winding down and that's perfectly okay. Slow down, enjoy comfort, and honour your feelings. 🌙";
  }
};

export const getSupportTips = (phase: CyclePhase): string => {
  switch (phase) {
    case 'Menstrual':
      return "Bring her a heating pad, her favourite snack, and some warm tea. Offer a foot rub or simply sit with her quietly. She needs gentleness right now.";
    case 'Follicular':
      return "She's feeling social and energetic! Plan a fun date night, go for a walk together, or surprise her with something new and exciting.";
    case 'Ovulation':
      return "Compliment her genuinely — she's feeling her most confident. This is a great time for quality time together and romantic gestures.";
    case 'Luteal':
      return "Be extra patient and understanding. Handle some of the chores without being asked, stock up on comfort food, and offer lots of cuddles.";
  }
};
