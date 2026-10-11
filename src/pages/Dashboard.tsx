import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, CircleDollarSign, FlaskConical, Lightbulb, Repeat2, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from 'zitejs/auth';
import { Progress } from '@project/components/ui/progress';
import { Button } from '@project/components/ui/button';
import ForecastChart from '../components/ForecastChart';
import { RiskBadge, ScoreRing } from '../components/Indicators';
import { CATEGORY_EMOJI, inr, useReady } from '../lib/finance';

function Stat({ label, value, sub, highlight, i }: { label: string; value: string; sub?: string; highlight?: boolean; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className={highlight
        ? 'rounded-2xl p-5 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-sm'
        : 'rounded-2xl p-5 bg-card border border-border hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200'}
    >
      <p className={highlight ? 'text-xs opacity-80' : 'text-xs text-muted-foreground'}>{label}</p>
      <p className="mt-1 text-2xl md:text-3xl font-bold font-mono tracking-tight">{value}</p>
      {sub && <p className={highlight ? 'text-xs mt-1 opacity-80' : 'text-xs mt-1 text-muted-foreground'}>{sub}</p>}
    </motion.div>
  );
}

const shortcuts = [
  { to: '/spending', icon: CircleDollarSign, title: 'Log money', description: 'Add income or an expense', tone: 'bg-emerald-500/10 text-emerald-600' },
  { to: '/simulator', icon: FlaskConical, title: 'Try a what-if', description: 'Test a decision first', tone: 'bg-violet-500/10 text-violet-600' },
  { to: '/goals', icon: Target, title: 'Save for a goal', description: 'Keep your target in sight', tone: 'bg-amber-500/10 text-amber-600' },
  { to: '/subscriptions', icon: Repeat2, title: 'Review bills', description: 'Check upcoming renewals', tone: 'bg-sky-500/10 text-sky-600' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { metrics: m, state } = useReady();
  const recent = [...state.transactions]
    .filter((t) => t.type === 'Expense' || t.type === 'Income')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const topCategories = [...m.categories].sort((a, b) => b.value - a.value).slice(0, 4);
  const maxCategory = Math.max(1, ...topCategories.map((c) => c.value));

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-violet-500/10 p-5 md:p-7"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Day {m.day} of {m.length} · your money snapshot</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Hey {user?.firstName || 'there'} 👋</h1>
            <p className="mt-2 max-w-xl text-sm md:text-base text-muted-foreground">Small decisions add up. See where you stand today and make your next move with confidence.</p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge risk={m.risk} className="text-sm px-3 py-1.5" />
            <Button asChild className="rounded-full">
              <Link to="/simulator">Simulate a decision <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat i={0} highlight label="Available balance" value={inr(m.balance)} sub={`${inr(m.upcoming)} reserved for bills`} />
        <Stat i={1} label="Safe daily allowance" value={inr(m.dailyAllowance)} sub={`Current pace ~${inr(m.pace)}/day`} />
        <Stat i={2} label="Day-${m.length} forecast" value={inr(m.forecastEnd)} sub={m.zeroDay ? `May reach ₹0 on day ${m.zeroDay}` : 'Projected cycle-end balance'} />
        <Stat i={3} label="Saved toward goals" value={inr(m.saved)} sub={`${inr(m.unexpected)} in unexpected costs`} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 border ${m.risk === 'Low' ? 'bg-primary/10 border-primary/30' : 'bg-accent/10 border-accent/30'}`}
      >
        <div className={`rounded-xl p-2 ${m.risk === 'Low' ? 'bg-primary/10' : 'bg-accent/10'}`}>
          <Lightbulb className={`h-5 w-5 ${m.risk === 'Low' ? 'text-primary' : 'text-accent'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{m.risk === 'Low' ? 'You have room to plan' : 'Your next move matters'}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{m.nudge}</p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
          <Link to="/simulator">Explore options <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </motion.div>

      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold">Make your next move</h2>
            <p className="text-sm text-muted-foreground">Shortcuts to the things you do most.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {shortcuts.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.to} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={item.to} className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className={`rounded-xl p-2.5 ${item.tone}`}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <p className="font-semibold">Your balance runway</p>
              <p className="text-xs text-muted-foreground">How your balance could move through the cycle.</p>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">{m.forecastEnd >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-primary" /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />} actual vs forecast</span>
          </div>
          <ForecastChart series={m.series} />
        </div>
        <Link to="/health" className="group rounded-2xl bg-card border border-border p-5 flex flex-col items-center justify-center transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex w-full items-center justify-between">
            <p className="font-semibold">Financial health</p>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="my-4"><ScoreRing score={m.score} label={m.scoreLabel} /></div>
          <p className="text-center text-xs text-muted-foreground">Explore what is driving your score and the next step to improve it.</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex justify-between items-center mb-4 gap-3">
            <div><p className="font-semibold">Goals in motion</p><p className="text-xs text-muted-foreground">A little progress still counts.</p></div>
            <Link to="/goals" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {state.goals.length === 0 && <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No goals yet. Give your money a purpose by <Link className="text-primary underline underline-offset-4" to="/goals">creating your first goal</Link>.</div>}
          <div className="space-y-4">
            {state.goals.slice(0, 3).map((g) => {
              const s = m.goals.find((x) => x.id === g.id);
              if (!s) return null;
              return (
                <div key={g.id}>
                  <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{g.emoji} {g.goalName}</span><span className="font-mono">{Math.round(s.progress * 100)}%</span></div>
                  <Progress value={s.progress * 100} className="h-2 mt-1.5" />
                  <p className={`text-xs mt-1 ${s.status === 'Behind' || s.status === 'Missed' ? 'text-accent' : 'text-muted-foreground'}`}>{s.status}{s.status !== 'Done' && ` · needs ${inr(s.requiredPerDay)}/day`}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex justify-between items-center mb-4 gap-3">
            <div><p className="font-semibold">Spending mix</p><p className="text-xs text-muted-foreground">Your biggest categories this cycle.</p></div>
            <Link to="/spending" className="text-xs text-primary hover:underline">View activity</Link>
          </div>
          {topCategories.length === 0
            ? <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Your category breakdown will appear after you log a few expenses.</div>
            : <div className="space-y-4">
                {topCategories.map((c) => (
                  <div key={c.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{CATEGORY_EMOJI[c.name] || '✨'} {c.name}</span>
                      <span className="font-mono text-xs">{inr(c.value)}</span>
                    </div>
                    <Progress value={(c.value / maxCategory) * 100} className="h-2" />
                  </div>
                ))}
              </div>}
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex justify-between items-center mb-4 gap-3"><div><p className="font-semibold">Recent activity</p><p className="text-xs text-muted-foreground">Your latest recorded money moves.</p></div><Link to="/spending" className="text-xs text-primary hover:underline">View all</Link></div>
        {recent.length === 0 && <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nothing logged yet. Start by <Link className="text-primary underline underline-offset-4" to="/spending">adding income or an expense</Link>.</div>}
        <div className="divide-y divide-border">
          {recent.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">{t.type === 'Income' ? '💸' : t.isUnexpected ? '⚡' : CATEGORY_EMOJI[t.category] || '✨'}</span>
                <div className="min-w-0"><p className="truncate font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{t.category} · {t.date}</p></div>
              </div>
              <span className={`shrink-0 font-mono font-semibold ${t.type === 'Income' ? 'text-primary' : 'text-foreground'}`}>{t.type === 'Income' ? inr(t.amount, true) : inr(-t.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
