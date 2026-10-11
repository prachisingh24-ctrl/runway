import { motion } from 'framer-motion';
import { RiskBadge, ScoreRing } from '../components/Indicators';
import { inr, useReady } from '../lib/finance';

const RISK_RULES = [
  { r: 'Low' as const, text: 'You finish with at least a 10% buffer' },
  { r: 'Medium' as const, text: 'You finish positive, but under the 10% buffer' },
  { r: 'High' as const, text: 'Your forecast dips below ₹0 before day 30' },
  { r: 'Critical' as const, text: 'Bills exceed your balance, or ₹0 is within 5 days' },
];

export default function Health() {
  const { metrics: m } = useReady();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Your financial report card</h1>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6 flex flex-col items-center justify-center">
          <ScoreRing score={m.score} size={200} />
          <p className="mt-4 text-xl font-bold">{m.scoreLabel}</p>
          <RiskBadge risk={m.risk} className="mt-2" />
        </div>
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6">
          <p className="font-semibold mb-4">What's driving it</p>
          <div className="space-y-4">
            {m.factors.map((f, i) => (
              <div key={f.key}>
                <div className="flex justify-between text-sm"><span>{f.label}</span><span className="font-mono font-semibold">{Math.round(f.points)}/{f.max}</span></div>
                <div className="mt-1.5 h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div className={`h-full rounded-full ${f.points / f.max >= 0.66 ? 'bg-primary' : f.points / f.max >= 0.33 ? 'bg-chart-4' : 'bg-destructive'}`}
                    initial={{ width: 0 }} animate={{ width: `${(f.points / f.max) * 100}%` }} transition={{ delay: i * 0.08, duration: 0.6 }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6">
          <p className="font-semibold mb-4">Badges</p>
          <div className="grid grid-cols-2 gap-3">
            {m.badges.map((b) => (
              <div key={b.label} className={`rounded-xl border p-3 flex items-center gap-3 ${b.earned ? 'border-primary/40 bg-primary/10' : 'border-border opacity-50 grayscale'}`}>
                <span className="text-2xl">{b.emoji}</span><span className="text-sm">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-6">
          <p className="font-semibold mb-4">How risk is decided</p>
          <div className="space-y-3">
            {RISK_RULES.map((x) => (
              <div key={x.r} className={`flex items-center gap-3 text-sm ${m.risk === x.r ? '' : 'opacity-60'}`}><RiskBadge risk={x.r} className="w-28 justify-center" /><span>{x.text}</span></div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Day-30</p><p className="font-mono font-bold">{inr(m.forecastEnd)}</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Pace/day</p><p className="font-mono font-bold">{inr(m.pace)}</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Streak</p><p className="font-mono font-bold">{m.streak}d</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
