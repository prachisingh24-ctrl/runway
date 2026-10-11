import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from 'zitejs/auth';
import { Progress } from '@project/components/ui/progress';
import { Button } from '@project/components/ui/button';
import ForecastChart from '../components/ForecastChart';
import { RiskBadge, ScoreRing } from '../components/Indicators';
import { CATEGORY_EMOJI, inr, useReady } from '../lib/finance';

function Stat({ label, value, sub, highlight, i }: { label: string; value: string; sub?: string; highlight?: boolean; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
      className={highlight ? 'rounded-2xl p-5 bg-primary text-primary-foreground' : 'rounded-2xl p-5 bg-card border border-border'}>
      <p className={highlight ? 'text-xs opacity-80' : 'text-xs text-muted-foreground'}>{label}</p>
      <p className="mt-1 text-2xl md:text-3xl font-bold font-mono">{value}</p>
      {sub && <p className={highlight ? 'text-xs mt-1 opacity-80' : 'text-xs mt-1 text-muted-foreground'}>{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { metrics: m, state } = useReady();
  const recent = [...state.transactions].filter((t) => t.type === 'Expense' || t.type === 'Income').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Day {m.day} of {m.length}</p>
          <h1 className="text-3xl font-bold tracking-tight">Hey {user?.firstName || 'there'} 👋</h1>
        </div>
        <RiskBadge risk={m.risk} className="text-sm px-3 py-1" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat i={0} highlight label="Balance" value={inr(m.balance)} sub={`${inr(m.upcoming)} reserved for bills`} />
        <Stat i={1} label="Today's allowance" value={inr(m.dailyAllowance)} sub={`Spending ~${inr(m.pace)}/day`} />
        <Stat i={2} label="Day-30 forecast" value={inr(m.forecastEnd)} sub={m.zeroDay ? `Hits ₹0 on day ${m.zeroDay}` : 'You finish in the green'} />
        <Stat i={3} label="Saved in goals" value={inr(m.saved)} sub={`${inr(m.unexpected)} unexpected costs`} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-4 flex items-start gap-3 border ${m.risk === 'Low' ? 'bg-primary/10 border-primary/30' : 'bg-accent/10 border-accent/30'}`}>
        <Lightbulb className={`w-5 h-5 shrink-0 mt-0.5 ${m.risk === 'Low' ? 'text-primary' : 'text-accent'}`} />
        <p className="text-sm flex-1">{m.nudge}</p>
        <Button asChild size="sm" variant="ghost" className="shrink-0"><Link to="/simulator">Simulate <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">Balance runway</p>
            <span className="text-xs text-muted-foreground flex items-center gap-1">{m.forecastEnd >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-primary" /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />} actual vs forecast</span>
          </div>
          <ForecastChart series={m.series} />
        </div>
        <Link to="/health" className="rounded-2xl bg-card border border-border p-5 flex flex-col items-center justify-center hover:border-primary/50 transition">
          <p className="font-semibold self-start">Health Score</p>
          <div className="my-4"><ScoreRing score={m.score} label={m.scoreLabel} /></div>
          <p className="text-xs text-muted-foreground">Tap to see what's driving it</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex justify-between items-center mb-4"><p className="font-semibold">Goals</p><Link to="/goals" className="text-xs text-primary">View all</Link></div>
          {state.goals.length === 0 && <p className="text-sm text-muted-foreground">No goals yet — <Link className="text-primary" to="/goals">set one</Link>.</p>}
          <div className="space-y-4">
            {state.goals.slice(0, 3).map((g) => {
              const s = m.goals.find((x) => x.id === g.id)!;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm"><span>{g.emoji} {g.goalName}</span><span className="font-mono">{Math.round(s.progress * 100)}%</span></div>
                  <Progress value={s.progress * 100} className="h-2 mt-1.5" />
                  <p className={`text-xs mt-1 ${s.status === 'Behind' || s.status === 'Missed' ? 'text-accent' : 'text-muted-foreground'}`}>{s.status}{s.status !== 'Done' && ` · needs ${inr(s.requiredPerDay)}/day`}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex justify-between items-center mb-4"><p className="font-semibold">Recent</p><Link to="/spending" className="text-xs text-primary">View all</Link></div>
          {recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing logged yet. Tap “Log money” to start.</p>}
          <div className="divide-y divide-border">
            {recent.map((t) => (
              <div key={t.id} className="py-2.5 flex justify-between text-sm">
                <span className="truncate">{t.type === 'Income' ? '💸' : t.isUnexpected ? '⚡' : CATEGORY_EMOJI[t.category] || '✨'} {t.title}</span>
                <span className={`font-mono ${t.type === 'Income' ? 'text-primary' : ''}`}>{t.type === 'Income' ? inr(t.amount, true) : inr(-t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
