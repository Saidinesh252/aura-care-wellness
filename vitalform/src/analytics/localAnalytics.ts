import type { Budget, Currency } from '../context';
import { localDate } from '../context';
import type { Journal } from '../adaptive';

export interface HabitStat {
  id: string;
  name: string;
  completedDays: number;
  totalDays: number;
  percentage: number;
  iconName: string;
}

export interface LocalInsightsSummary {
  totalDaysTracked: number;
  currentStreak: number;
  bestStreak: number;
  habits: HabitStat[];
  estimatedMonthlySavingsINR: number;
  estimatedMonthlySavingsUSD: number;
  cumulativeSavingsINR: number;
  cumulativeSavingsUSD: number;
  budgetLabel: string;
  profileDaysActive: number;
}

// Baseline cost benchmarks for wellness coaching, gym memberships, & luxury skincare:
// Clinical/Luxury Baseline: ~₹7,500/mo ($85/mo)
// Mid-Range Baseline: ~₹4,000/mo ($45/mo)
// Student / Smart Value: ~₹1,200/mo ($15/mo)
// Zero-Cost DIY: ~₹350/mo ($4/mo)
const TIER_COSTS: Record<Budget, { inr: number; usd: number }> = {
  luxury: { inr: 7500, usd: 85 },
  mid: { inr: 4000, usd: 45 },
  student: { inr: 1200, usd: 15 },
  zero: { inr: 350, usd: 4 },
};

export function computeLocalAnalytics(
  days: Record<string, Journal>,
  budget: Budget,
  _currency?: Currency,
  profileStarted?: string | null,
  today = localDate()
): LocalInsightsSummary {
  const dates = Object.keys(days).sort();
  const totalDaysTracked = Math.max(1, dates.length);

  let amCount = 0;
  let pmCount = 0;
  let workoutCount = 0;
  let hydrationCount = 0;

  for (const date of dates) {
    const j = days[date];
    if (j.habits.am) amCount++;
    if (j.habits.pm) pmCount++;
    if (j.habits.workout) workoutCount++;
    if (j.water >= 1500) hydrationCount++;
  }

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  const dateObj = new Date(`${today}T12:00:00`);
  // Check backwards from today for current streak
  let checkDate = new Date(dateObj);
  // If today is not done yet, start from yesterday
  const todayJournal = days[today];
  const todayDone = todayJournal?.habits.workout || todayJournal?.habits.am || (todayJournal?.water ?? 0) >= 1000;
  if (!todayDone) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = localDate(checkDate);
    const j = days[key];
    const isDone = j?.habits.workout || j?.habits.am || (j?.water ?? 0) >= 1000;
    if (isDone) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best historical streak
  let prevDateVal: number | null = null;
  for (const date of dates) {
    const j = days[date];
    const isDone = j?.habits.workout || j?.habits.am || (j?.water ?? 0) >= 1000;
    const curVal = new Date(`${date}T12:00:00`).getTime();

    if (isDone) {
      if (prevDateVal !== null && curVal - prevDateVal <= 86400000 * 1.5) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      prevDateVal = curVal;
      bestStreak = Math.max(bestStreak, tempStreak);
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak, 1);

  // Calculate days active
  let profileDaysActive = 1;
  if (profileStarted) {
    const startMs = new Date(`${profileStarted}T12:00:00`).getTime();
    const nowMs = new Date(`${today}T12:00:00`).getTime();
    profileDaysActive = Math.max(1, Math.round((nowMs - startMs) / 86400000) + 1);
  } else {
    profileDaysActive = totalDaysTracked;
  }

  // Savings computation
  const luxuryBaseline = TIER_COSTS.luxury;
  const currentCost = TIER_COSTS[budget];

  const estimatedMonthlySavingsINR = Math.max(0, luxuryBaseline.inr - currentCost.inr);
  const estimatedMonthlySavingsUSD = Math.max(0, luxuryBaseline.usd - currentCost.usd);

  const dailySavingsINR = estimatedMonthlySavingsINR / 30.0;
  const dailySavingsUSD = estimatedMonthlySavingsUSD / 30.0;

  const cumulativeSavingsINR = Math.round(dailySavingsINR * profileDaysActive);
  const cumulativeSavingsUSD = Math.round(dailySavingsUSD * profileDaysActive);

  const habits: HabitStat[] = [
    {
      id: 'am',
      name: 'AM Skincare & SPF Shield',
      completedDays: amCount,
      totalDays: totalDaysTracked,
      percentage: Math.round((amCount / totalDaysTracked) * 100),
      iconName: 'Sparkles',
    },
    {
      id: 'pm',
      name: 'PM Active Barrier Recovery',
      completedDays: pmCount,
      totalDays: totalDaysTracked,
      percentage: Math.round((pmCount / totalDaysTracked) * 100),
      iconName: 'Moon',
    },
    {
      id: 'workout',
      name: 'Movement & Biomechanics',
      completedDays: workoutCount,
      totalDays: totalDaysTracked,
      percentage: Math.round((workoutCount / totalDaysTracked) * 100),
      iconName: 'Dumbbell',
    },
    {
      id: 'water',
      name: 'Daily Hydration Target',
      completedDays: hydrationCount,
      totalDays: totalDaysTracked,
      percentage: Math.round((hydrationCount / totalDaysTracked) * 100),
      iconName: 'Droplets',
    },
  ];

  return {
    totalDaysTracked,
    currentStreak,
    bestStreak,
    habits,
    estimatedMonthlySavingsINR,
    estimatedMonthlySavingsUSD,
    cumulativeSavingsINR,
    cumulativeSavingsUSD,
    budgetLabel: budget === 'zero' ? 'Zero-Cost DIY' : budget === 'student' ? 'Student / Smart Value' : budget === 'mid' ? 'Performance' : 'Luxury Tier',
    profileDaysActive,
  };
}
