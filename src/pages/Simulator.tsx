import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { recordSimulation } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Badge } from '@project/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import ForecastChart from '../components/ForecastChart';
import Confetti from '../components/Confetti';
import { DECISION_TYPES, simulate, type Decision, type DecisionType } from '../lib/engine';
import { CATEGORIES, errMsg, inr, useReady } from '../lib/finance';

const EXAMPLES: { label: string; d: Partial<Decision> }[] = [
  { label: '🎤 Concert ₹1,800', d: { type: 'One-time Buy', label: 'Concert ticket', amount: 1800, category: 'Fun' } },
  { label: '📺 Netflix ₹199/mo', d: { type: 'New Subscription', label: 'Netflix', amount: 199 } },
  { label: '👟 Sneakers ₹3,500', d: { type: 'One-time Buy', label: 'Sneakers', amount: 3500, category: 'Shopping' } },
  { label: '💼 Freelance +₹1,500', d: { type: 'Extra Income', label: 'Freelance gig', amount: 1500 } },
];

function Delta({ label, before, after, fmt = inr, higherIsBetter = true }: { label: string; before: number | string; after: number | string; fmt?: (n: number) => string; higherIsBetter?: boolean }) {
  const num = typeof before === 'number' && typeof after === 'number';
  const better = num ? (higherIsBetter ? after > before : after < before) : false;
  const worse = num ? (higherIsBetter ? after < before : after > before) : before !== after;
  const show = (v: number | string) => (typeof v === 'number' ? fmt(v) : v);
  return (
    <motion.div layout className="rounded-2xl bg-card border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2 flex-wrap font-mono">
        <span className="text-muted-foreground">{show(before)}</span><ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className={`text-xl font-bold ${better ? 'text-primary' : worse ? 'text-accent' : ''}`}>{show(after)}</span>
      </div>
    </motion.div>
  );
}

const VERDICT = {
  Safe: { icon: CheckCircle2, cls: 'bg-primary/15 border-primary/40 text-primary' },
  Caution: { icon: AlertTriangle, cls: 'bg-chart-4/15 border-chart-4/40 text-chart-4' },
  Risky: { icon: ShieldAlert, cls: 'bg-destructive/15 border-destructive/40 text-destructive' },
};

export default function Simulator() {
  const { input, state, refresh, today } = useReady();
  const [params] = useSearchParams();
  const activeSubs = state.subscriptions.filter((s) => s.status === 'Active');
  const [d, setD] = useState<Decision>(() => ({
    type: (params.get('type') as DecisionType) || 'One-time Buy',
    label: params.get('label') || '',
    amount: Number(params.get('amount')) || 0,
    category: 'Fun',
    subscriptionId: params.get('sub') || undefined,
    goalId: state.goals[0]?.id,
  }));
  const [busy, setBusy] = useState(false);
  const [party, setParty] = useState('');

  const effective = useMemo<Decision>(() => {
    if (d.type === 'Cancel Subscription') {
      const s = activeSubs.find((x) => x.id === d.subscriptionId);
      return { ...d, amount: s?.amount || 0, label: s ? `Cancel ${s.name}` : 'Cancel subscription' };
    }
    if (d.type === 'Save') {
      const g = state.goals.find((x) => x.id === d.goalId);
      return { ...d, label: g ? `Save toward ${g.goalName}` : 'Save' };
    }
    return d;
  }, [d, activeSubs, state.goals]);

  const ready = d.type === 'Cancel Subscription' ? !!effective.subscriptionId && effective.amount > 0 : d.type === 'Save' ? !!d.goalId && d.amount > 0 : d.amount > 0 && !!d.label.trim();
  const sim = useMemo(() => (ready ? simulate(input, effective) : null), [ready, input, effective]);

  const record = async (commit: boolean) => {
    setBusy(true);
    try {
      const res = await recordSimulation({ today, commit, decision: effective });
      await refresh();
      if (res.goalCompleted) setParty('Goal complete!');
      toast.success(commit ? 'Done — your numbers are updated' : 'Saved to history, nothing changed');
      setD({ ...d, label: '', amount: 0 });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">What if I…</h1><p className="text-muted-foreground text-sm">Test the trade-off before money moves. Your saved budget stays unchanged until you apply a decision.</p></div>
      <div className="flex flex-wrap gap-2">{EXAMPLES.map((e) => <Button key={e.label} size="sm" variant="outline" className="rounded-full" onClick={() => setD({ ...d, ...e.d } as Decision)}>{e.label}</Button>)}</div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><Label>Decision</Label>
          <Select value={d.type} onValueChange={(v) => setD({ ...d, type: v as DecisionType })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{DECISION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        </div>
        {d.type === 'Cancel Subscription' ? (
          <div className="lg:col-span-3"><Label>Subscription</Label>
            {activeSubs.length === 0 ? <p className="text-sm text-muted-foreground mt-3">No active subscriptions.</p> : (
              <Select value={d.subscriptionId} onValueChange={(v) => setD({ ...d, subscriptionId: v })}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick one" /></SelectTrigger><SelectContent>{activeSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {inr(s.amount)}</SelectItem>)}</SelectContent></Select>
            )}
          </div>
        ) : (
          <>
            {d.type === 'Save' ? (
              <div><Label>Goal</Label>
                {state.goals.length === 0 ? <p className="text-sm text-muted-foreground mt-3">Create a goal first.</p> : (
                  <Select value={d.goalId} onValueChange={(v) => setD({ ...d, goalId: v })}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick a goal" /></SelectTrigger><SelectContent>{state.goals.map((g) => <SelectItem key={g.id} value={g.id}>{g.emoji} {g.goalName}</SelectItem>)}</SelectContent></Select>
                )}
              </div>
            ) : (
              <div><Label>What</Label><Input className="mt-1.5" placeholder="Concert ticket" value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} /></div>
            )}
            <div><Label>Amount (₹){d.type === 'New Subscription' && ' / month'}</Label><Input className="mt-1.5 font-mono" type="number" value={d.amount || ''} onChange={(e) => setD({ ...d, amount: Number(e.target.value) })} /></div>
            {d.type === 'One-time Buy' && (
              <div><Label>Category</Label><Select value={d.category} onValueChange={(v) => setD({ ...d, category: v })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            )}
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!sim ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Fill in a decision to see the before → after.</motion.div>
        ) : (
          <motion.div key="sim" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {(() => { const V = VERDICT[sim.verdict]; return (
              <div className={`rounded-2xl border p-5 flex items-start gap-3 ${V.cls}`}><V.icon className="w-6 h-6 shrink-0" /><div><p className="font-bold text-lg">Verdict: {sim.verdict}</p><p className="text-sm text-foreground/90">{sim.advice}</p></div></div>
            ); })()}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Delta label="Remaining balance" before={sim.before.balance} after={sim.after.balance} />
              <Delta label="Daily allowance" before={sim.before.dailyAllowance} after={sim.after.dailyAllowance} />
              <Delta label="Health Score" before={sim.before.score} after={sim.after.score} fmt={(n) => String(n)} />
              <Delta label="Risk" before={sim.before.risk} after={sim.after.risk} />
              <Delta label="Day-30 forecast" before={sim.before.forecastEnd} after={sim.after.forecastEnd} />
              {sim.goalImpacts[0] ? (
                <Delta label={`${sim.goalImpacts[0].goal.emoji} ${sim.goalImpacts[0].goal.goalName}`} before={sim.goalImpacts[0].before.status} after={sim.goalImpacts[0].after.status} />
              ) : <Delta label="Monthly commitments" before={sim.before.monthlyCommitments} after={sim.after.monthlyCommitments} higherIsBetter={false} />}
            </div>
            <div className="rounded-2xl bg-card border border-border p-5"><div className="flex flex-wrap items-start justify-between gap-2 mb-2"><div><p className="font-semibold">Your month, two ways</p><p className="text-xs text-muted-foreground">Compare the baseline with this decision across the remaining days.</p></div><Badge variant="outline">Live preview</Badge></div><ForecastChart series={sim.before.series} compare={sim.after.series} /></div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">Applying updates your budget and recalculates connected metrics. Skipping records this what-if in history without applying it.</div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full px-8" disabled={busy || !ready} onClick={() => record(true)}>{busy ? "Updating…" : "Apply decision"}</Button>
              <Button size="lg" variant="outline" className="rounded-full" disabled={busy} onClick={() => record(false)}><X className="w-4 h-4 mr-1" /> Skip & save to history</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <p className="font-semibold mb-3">History</p>
        <div className="rounded-2xl bg-card border border-border divide-y divide-border">
          {state.simulations.length === 0 && <p className="p-6 text-sm text-center text-muted-foreground">Your past what-ifs will show up here.</p>}
          {state.simulations.slice(0, 12).map((s) => (
            <div key={s.id} className="p-3.5 flex items-center gap-3 text-sm">
              <div className="flex-1 min-w-0"><p className="truncate font-medium">{s.decision}</p><p className="text-xs text-muted-foreground">{s.decisionType} · {s.created ? format(parseISO(s.created), 'MMM d, h:mm a') : ''}</p></div>
              <span className="font-mono text-xs text-muted-foreground">{s.scoreBefore}→{s.scoreAfter}</span>
              <Badge variant="outline" className={VERDICT[s.verdict as keyof typeof VERDICT]?.cls}>{s.verdict}</Badge>
              <Badge variant={s.committed ? 'default' : 'secondary'}>{s.committed ? 'Did it' : 'Skipped'}</Badge>
            </div>
          ))}
        </div>
      </div>
      <Confetti show={!!party} message={party} onDone={() => setParty('')} />
    </div>
  );
}
