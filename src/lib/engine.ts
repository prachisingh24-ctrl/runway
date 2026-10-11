// Runway finance engine — pure functions shared by frontend and backend.

export type Txn = {
  id: string;
  title: string;
  amount: number;
  type: string; // Expense | Income | Goal Contribution | Goal Withdrawal
  category: string;
  isUnexpected: boolean;
  date: string; // YYYY-MM-DD
  note: string;
};
export type Goal = {
  id: string;
  goalName: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  completed: boolean;
};
export type Sub = {
  id: string;
  name: string;
  amount: number;
  kind: string;
  nextRenewal: string;
  status: string;
};
export type Cycle = {
  id: string;
  cycleName: string;
  startingBalance: number;
  startDate: string;
  lengthDays: number;
};
export type EngineInput = {
  cycle: Cycle;
  transactions: Txn[];
  goals: Goal[];
  subscriptions: Sub[];
  today: string;
  simulationCount?: number;
};

export type Risk = 'Low' | 'Medium' | 'High' | 'Critical';
export const RISK_RANK: Record<Risk, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

export type GoalStatus = {
  id: string;
  remaining: number;
  progress: number;
  requiredPerDay: number;
  status: 'Done' | 'On track' | 'Behind' | 'Missed';
};

export type Metrics = {
  day: number;
  length: number;
  daysLeft: number;
  balance: number;
  income: number;
  spent: number;
  saved: number;
  unexpected: number;
  upcoming: number;
  monthlyCommitments: number;
  freeToSpend: number;
  dailyAllowance: number;
  pace: number;
  forecastEnd: number;
  zeroDay: number | null;
  surplusPerDay: number;
  risk: Risk;
  score: number;
  scoreLabel: string;
  factors: { key: string; label: string; points: number; max: number; hint: string }[];
  goals: GoalStatus[];
  series: { day: number; label: string; actual: number | null; forecast: number | null }[];
  categories: { name: string; value: number }[];
  nudge: string;
  streak: number;
  badges: { emoji: string; label: string; earned: boolean }[];
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const dayNum = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};
export const dateFromNum = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
export const addMonth = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m, Math.min(d, 28)));
  return dt.toISOString().slice(0, 10);
};

function effect(t: Txn) {
  if (t.type === 'Income' || t.type === 'Goal Withdrawal') return t.amount;
  return -t.amount; // Expense, Goal Contribution
}

export function compute(input: EngineInput): Metrics {
  const { cycle, transactions, goals, subscriptions, today } = input;
  const start = cycle.startingBalance || 0;
  const L = cycle.lengthDays || 30;
  const startN = dayNum(cycle.startDate);
  const todayN = dayNum(today);
  const endN = startN + L - 1;
  const day = Math.max(1, Math.min(L, todayN - startN + 1));
  const daysLeft = L - day + 1;

  let income = 0, spent = 0, goalNet = 0, unexpected = 0, discretionary = 0;
  const catMap: Record<string, number> = {};
  const dailyDisc: Record<number, number> = {};
  for (const t of transactions) {
    if (t.type === 'Income') income += t.amount;
    else if (t.type === 'Expense') {
      spent += t.amount;
      catMap[t.category || 'Other'] = (catMap[t.category || 'Other'] || 0) + t.amount;
      if (t.isUnexpected) unexpected += t.amount;
      else if (t.category !== 'Bills') {
        discretionary += t.amount;
        const di = Math.max(1, dayNum(t.date) - startN + 1);
        dailyDisc[di] = (dailyDisc[di] || 0) + t.amount;
      }
    } else if (t.type === 'Goal Contribution') goalNet += t.amount;
    else if (t.type === 'Goal Withdrawal') goalNet -= t.amount;
  }
  const balance = start + income - spent - goalNet;

  const active = subscriptions.filter((s) => s.status === 'Active');
  const monthlyCommitments = active.reduce((a, s) => a + s.amount, 0);
  const dueInCycle = active.filter((s) => {
    if (!s.nextRenewal) return false;
    const n = dayNum(s.nextRenewal);
    return n <= endN; // overdue counts as still owed
  });
  const upcoming = dueInCycle.reduce((a, s) => a + s.amount, 0);
  const freeToSpend = balance - upcoming;
  const dailyAllowance = Math.max(0, freeToSpend / daysLeft);

  const rawPace = discretionary / day;
  const w = Math.min(1, day / 5);
  const pace = w * rawPace + (1 - w) * dailyAllowance;
  const remainingDays = L - day;
  const forecastEnd = freeToSpend - pace * remainingDays;
  let zeroDay: number | null = null;
  if (freeToSpend <= 0) zeroDay = day;
  else if (forecastEnd < 0 && pace > 0) zeroDay = Math.min(L, day + Math.floor(freeToSpend / pace));
  const surplusPerDay = Math.max(0, forecastEnd) / daysLeft;

  const bufferTarget = start * 0.1;
  let risk: Risk = 'Low';
  if (freeToSpend < 0 || (zeroDay !== null && zeroDay - day <= 5)) risk = 'Critical';
  else if (forecastEnd < 0) risk = 'High';
  else if (forecastEnd < bufferTarget) risk = 'Medium';

  // Goals
  const goalStatuses: GoalStatus[] = goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.savedAmount);
    const progress = g.targetAmount > 0 ? clamp01(g.savedAmount / g.targetAmount) : 0;
    const dl = g.deadline ? dayNum(g.deadline) - todayN + 1 : daysLeft;
    const requiredPerDay = remaining / Math.max(1, dl);
    let status: GoalStatus['status'] = 'On track';
    if (remaining <= 0) status = 'Done';
    else if (dl < 1) status = 'Missed';
    else if (requiredPerDay > surplusPerDay + 0.01) status = 'Behind';
    return { id: g.id, remaining, progress, requiredPerDay, status };
  });

  // Health score
  const paceShortfall = pace <= dailyAllowance ? 1 : clamp01(1 - (pace - dailyAllowance) / Math.max(dailyAllowance, 1));
  const totalT = goals.reduce((a, g) => a + g.targetAmount, 0);
  const totalS = goals.reduce((a, g) => a + Math.min(g.savedAmount, g.targetAmount), 0);
  const savingsPts = totalT > 0 ? 25 * Math.min(1, totalS / totalT / Math.max(0.15, day / L)) : 12;
  const ratio = start > 0 ? monthlyCommitments / start : 0;
  const factors = [
    { key: 'pace', label: 'Spending pace vs allowance', points: 30 * paceShortfall, max: 30,
      hint: pace <= dailyAllowance ? 'You spend within your daily allowance' : `You spend ₹${Math.round(pace - dailyAllowance)}/day over` },
    { key: 'savings', label: 'Savings progress', points: savingsPts, max: 25,
      hint: totalT > 0 ? `${Math.round((totalS / totalT) * 100)}% of goal targets saved` : 'Set a goal to unlock full points' },
    { key: 'commit', label: 'Commitment load', points: 20 * clamp01(1 - (ratio - 0.2) / 0.4), max: 20,
      hint: `${Math.round(ratio * 100)}% of your budget is locked in` },
    { key: 'buffer', label: 'Emergency buffer', points: 15 * clamp01(forecastEnd / Math.max(bufferTarget, 1)), max: 15,
      hint: `Aim to finish with ₹${Math.round(bufferTarget)} left` },
    { key: 'unexpected', label: 'Unexpected hits', points: 10 * clamp01(1 - unexpected / Math.max(start * 0.15, 1)), max: 10,
      hint: unexpected > 0 ? `₹${Math.round(unexpected)} in surprise costs` : 'No surprise costs yet' },
  ];
  const score = Math.round(factors.reduce((a, f) => a + f.points, 0));
  const scoreLabel = score >= 80 ? 'Thriving' : score >= 65 ? 'Pretty solid' : score >= 45 ? 'Wobbly' : 'Danger zone';

  // Series
  const series: Metrics['series'] = [];
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i <= L; i++) {
    const dn = startN + i - 1;
    const point = { day: i, label: `D${i}`, actual: null as number | null, forecast: null as number | null };
    if (i <= day) {
      point.actual = Math.round(start + sorted.filter((t) => dayNum(t.date) <= dn).reduce((a, t) => a + effect(t), 0));
    }
    if (i >= day) {
      const renewals = dueInCycle.filter((s) => Math.max(dayNum(s.nextRenewal), todayN) <= dn).reduce((a, s) => a + s.amount, 0);
      point.forecast = Math.round(balance - renewals - pace * (i - day));
    }
    series.push(point);
  }

  const categories = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Streak
  const idealDaily = Math.max(1, (start + income - monthlyCommitments) / L);
  let streak = 0;
  for (let i = day - 1; i >= 1; i--) {
    if ((dailyDisc[i] || 0) <= idealDaily) streak++;
    else break;
  }

  const inr = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;
  let nudge = '';
  if (freeToSpend < 0) nudge = `Your upcoming bills are ${inr(freeToSpend)} more than your balance. Pause a subscription or add income ASAP.`;
  else if (risk === 'Critical' || risk === 'High')
    nudge = `At this pace you'll hit ₹0 on day ${zeroDay}. Cut ${inr(pace - dailyAllowance)}/day to finish strong.`;
  else if (risk === 'Medium') nudge = `You're on track but running thin. Keep daily spend under ${inr(dailyAllowance)} to build a buffer.`;
  else nudge = `You're crushing it — on pace to finish with ~${inr(forecastEnd)}. Move some into a goal?`;

  const txCount = transactions.filter((t) => t.type === 'Expense' || t.type === 'Income').length;
  const badges = [
    { emoji: '🔥', label: `${Math.max(streak, 3)}-day under-budget streak`, earned: streak >= 3 },
    { emoji: '🧠', label: 'Simulated before buying ×3', earned: (input.simulationCount || 0) >= 3 },
    { emoji: '🎯', label: 'Goal crusher', earned: goalStatuses.some((g) => g.status === 'Done') },
    { emoji: '🛟', label: 'Low-risk legend', earned: risk === 'Low' && day >= 3 },
    { emoji: '🧾', label: 'Logged 10 entries', earned: txCount >= 10 },
  ];

  return {
    day, length: L, daysLeft, balance, income, spent, saved: goalNet, unexpected, upcoming, monthlyCommitments,
    freeToSpend, dailyAllowance, pace, forecastEnd, zeroDay, surplusPerDay, risk, score, scoreLabel, factors,
    goals: goalStatuses, series, categories, nudge, streak, badges,
  };
}

// ---------- Decision simulation ----------
export type DecisionType = 'One-time Buy' | 'New Subscription' | 'Cancel Subscription' | 'Save' | 'Extra Income';
export const DECISION_TYPES: DecisionType[] = ['One-time Buy', 'New Subscription', 'Cancel Subscription', 'Save', 'Extra Income'];
export type Decision = {
  type: DecisionType;
  label: string;
  amount: number;
  category?: string;
  subscriptionId?: string;
  goalId?: string;
};

export function applyDecision(input: EngineInput, d: Decision): EngineInput {
  const base = { id: 'sim', title: d.label, amount: d.amount, isUnexpected: false, date: input.today, note: '' };
  switch (d.type) {
    case 'One-time Buy':
      return { ...input, transactions: [...input.transactions, { ...base, type: 'Expense', category: d.category || 'Other' }] };
    case 'Extra Income':
      return { ...input, transactions: [...input.transactions, { ...base, type: 'Income', category: 'Other' }] };
    case 'Save':
      return {
        ...input,
        transactions: [...input.transactions, { ...base, type: 'Goal Contribution', category: 'Other' }],
        goals: input.goals.map((g) => (g.id === d.goalId ? { ...g, savedAmount: g.savedAmount + d.amount } : g)),
      };
    case 'New Subscription':
      return {
        ...input,
        subscriptions: [...input.subscriptions, { id: 'sim', name: d.label, amount: d.amount, kind: 'Subscription', nextRenewal: input.today, status: 'Active' }],
      };
    case 'Cancel Subscription':
      return { ...input, subscriptions: input.subscriptions.map((s) => (s.id === d.subscriptionId ? { ...s, status: 'Cancelled' } : s)) };
  }
}

export type Verdict = 'Safe' | 'Caution' | 'Risky';
export function simulate(input: EngineInput, d: Decision) {
  const before = compute(input);
  const after = compute(applyDecision(input, d));
  const riskUp = RISK_RANK[after.risk] > RISK_RANK[before.risk];
  const allowanceDrop = before.dailyAllowance > 0 ? (before.dailyAllowance - after.dailyAllowance) / before.dailyAllowance : 0;
  let verdict: Verdict = 'Safe';
  if (RISK_RANK[after.risk] >= 2 && (riskUp || after.forecastEnd < before.forecastEnd)) verdict = 'Risky';
  else if (before.score - after.score >= 8 || riskUp || allowanceDrop > 0.15) verdict = 'Caution';

  const inr = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;
  let advice = '';
  const spendLike = d.type === 'One-time Buy' || d.type === 'New Subscription';
  if (verdict === 'Safe') {
    advice = spendLike ? `Go for it — you'll still finish with about ${inr(after.forecastEnd)}.` : `Smart move. Your health score ${after.score >= before.score ? 'goes up' : 'barely moves'}.`;
  } else if (spendLike) {
    const daysOfAllowance = Math.ceil(d.amount / Math.max(1, before.dailyAllowance));
    advice = before.surplusPerDay > 1
      ? `That's ${daysOfAllowance} days of allowance. Set aside ${inr(before.surplusPerDay)}/day for ${Math.ceil(d.amount / before.surplusPerDay)} days first.`
      : `That's ${daysOfAllowance} days of allowance with no surplus to cover it. Skip it or find ${inr(d.amount)} extra first.`;
  } else if (d.type === 'Save') {
    advice = `Saving is great, but it squeezes your daily allowance to ${inr(after.dailyAllowance)}. Try a smaller amount.`;
  } else advice = 'This helps, but your overall plan still needs attention.';

  const goalImpacts = input.goals.filter((g) => !g.completed).slice(0, 3).map((g) => ({
    goal: g,
    before: before.goals.find((x) => x.id === g.id)!,
    after: after.goals.find((x) => x.id === g.id)!,
  }));

  return { before, after, verdict, advice, goalImpacts };
}
