import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarClock, PiggyBank, ShieldAlert, ShoppingBag, Wallet } from 'lucide-react';
import { RiskBadge, ScoreRing } from '../components/Indicators';
import { inr, useReady } from '../lib/finance';

const RISK_RULES = [
  { r: 'Low' as const, text: 'Forecast finishes with at least a 10% starting-balance buffer.' },
  { r: 'Medium' as const, text: 'Forecast stays positive, but finishes below the 10% buffer target.' },
  { r: 'High' as const, text: 'Forecast falls below ₹0 before the cycle ends.' },
  { r: 'Critical' as const, text: 'Planned cash flows exceed available money, or the forecast reaches ₹0 within five days.' },
];
const ACTIONS: Record<string, { title: string; detail: string; to: string; cta: string; icon: typeof Wallet }> = {
  pace: { title: 'Bring daily spending back in line', detail: 'Review recent purchases and test a lower-cost choice before spending.', to: '/spending', cta: 'Review spending', icon: ShoppingBag },
  savings: { title: 'Give savings a clear target', detail: 'Create or update a goal, then choose a daily amount that fits your allowance.', to: '/goals', cta: 'Tune savings goals', icon: PiggyBank },
  commit: { title: 'Reduce recurring commitments', detail: 'Check the next renewal dates and simulate pausing or cancelling a subscription.', to: '/subscriptions', cta: 'Review recurring costs', icon: CalendarClock },
  buffer: { title: 'Build a small end-of-cycle cushion', detail: 'Compare a purchase with a cheaper alternative and protect money for essentials.', to: '/simulator', cta: 'Run a what-if', icon: Wallet },
  unexpected: { title: 'Make room for surprise costs', detail: 'Review unexpected expenses and adjust the next few discretionary purchases.', to: '/spending', cta: 'Review transactions', icon: ShieldAlert },
};
export default function Health() {
  const { metrics: m } = useReady();
  const weakest = [...m.factors].sort((a, b) => (a.points / Math.max(1, a.max)) - (b.points / Math.max(1, b.max)))[0];
  const recommendation = ACTIONS[weakest?.key] || ACTIONS.buffer;
  const RecommendationIcon = recommendation.icon;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Your financial report card</h1><p className="mt-1 text-sm text-muted-foreground">Your score is a guide to this budget cycle, not a credit score or a guarantee.</p></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6 flex flex-col items-center justify-center">
          <ScoreRing score={m.score} size={200} /><p className="mt-4 text-xl font-bold">{m.scoreLabel}</p><RiskBadge risk={m.risk} className="mt-2" />
          <p className="mt-3 text-center text-xs text-muted-foreground">Score: {m.score}/100 · based on spending pace, savings, commitments, buffer and unexpected costs.</p>
        </div>
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6">
          <p className="font-semibold mb-4">What's driving your score</p>
          <div className="space-y-4">
            {m.factors.map((f, i) => <div key={f.key}>
              <div className="flex justify-between gap-3 text-sm"><span>{f.label}</span><span className="shrink-0 font-mono font-semibold">{Math.round(f.points)}/{f.max}</span></div>
              <div className="mt-1.5 h-2.5 rounded-full bg-muted overflow-hidden"><motion.div className={"h-full rounded-full " + (f.points / f.max >= 0.66 ? 'bg-primary' : f.points / f.max >= 0.33 ? 'bg-chart-4' : 'bg-destructive')} initial={{ width: 0 }} animate={{ width: Math.max(0, Math.min(100, (f.points / f.max) * 100)) + '%' }} transition={{ delay: i * 0.08, duration: 0.6 }} /></div>
              <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>
            </div>)}
          </div>
        </div>
      </div>
      <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-violet-500/10 p-5 md:p-6">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-primary/10 p-2.5"><RecommendationIcon className="h-5 w-5 text-primary" /></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Your best next step</p><h2 className="mt-1 text-lg font-bold">{recommendation.title}</h2><p className="mt-1 text-sm text-muted-foreground">{recommendation.detail}</p>
            <p className="mt-2 text-xs text-muted-foreground">Picked because "{weakest?.label || 'your cash buffer'}" currently has the lowest share of available points ({weakest ? Math.round(weakest.points) : 0}/{weakest?.max || 0}).</p>
            <Link to={recommendation.to} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{recommendation.cta}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6"><p className="font-semibold mb-4 flex items-center gap-2"><BadgeCheck className="h-4 w-4" /> Badges</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{m.badges.map((b) => <div key={b.label} className={"rounded-xl border p-3 flex items-center gap-3 " + (b.earned ? 'border-primary/40 bg-primary/10' : 'border-border opacity-50 grayscale')}><span className="text-2xl">{b.emoji}</span><span className="text-sm">{b.label}</span></div>)}</div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-6"><p className="font-semibold mb-4">How risk is decided</p>
          <div className="space-y-3">{RISK_RULES.map((x) => <div key={x.r} className={"flex flex-col sm:flex-row sm:items-center gap-2 text-sm " + (m.risk === x.r ? '' : 'opacity-60')}><RiskBadge risk={x.r} className="w-28 justify-center shrink-0" /><span>{x.text}</span></div>)}</div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Cycle-end forecast</p><p className="font-mono font-bold">{inr(m.forecastEnd)}</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Observed pace/day</p><p className="font-mono font-bold">{inr(m.pace)}</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Under-budget streak</p><p className="font-mono font-bold">{m.streak} days</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
