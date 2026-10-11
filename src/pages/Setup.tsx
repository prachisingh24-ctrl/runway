import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { startCycle } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Progress } from '@project/components/ui/progress';
import DateField from '../components/DateField';
import { errMsg, inr, todayStr, useFinance } from '../lib/finance';

type Commit = { name: string; amount: string; kind: 'Subscription' | 'Commitment' };
const PRESETS: Commit[] = [
  { name: 'Metro / bus pass', amount: '800', kind: 'Commitment' },
  { name: 'Spotify', amount: '119', kind: 'Subscription' },
  { name: 'Phone recharge', amount: '299', kind: 'Commitment' },
];
const EMOJIS = ['🎧', '👟', '✈️', '🎮', '🛟', '💻', '🎁', '📷'];

export default function Setup({ onCancel, restart }: { onCancel?: () => void; restart?: boolean }) {
  const { refresh, state } = useFinance();
  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState('10000');
  const [commits, setCommits] = useState<Commit[]>(restart ? [] : PRESETS);
  const [goal, setGoal] = useState({ goalName: 'New earbuds', emoji: '🎧', targetAmount: '2000', deadline: format(addDays(new Date(), 29), 'yyyy-MM-dd') });
  const [saving, setSaving] = useState(false);

  const bal = Number(balance) || 0;
  const existing = restart ? state.subscriptions.filter((s) => s.status === 'Active').reduce((a, s) => a + s.amount, 0) : 0;
  const total = commits.reduce((a, c) => a + (Number(c.amount) || 0), 0) + existing;
  const free = bal - total;
  const commitsValid = commits.every((c) => c.name.trim() && Number(c.amount) > 0) && free >= 0;
  const balValid = bal > 0 && bal <= 10000000;
  const goalValid = !goal.goalName.trim() || Number(goal.targetAmount) > 0;

  const update = (i: number, patch: Partial<Commit>) => setCommits((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const finish = async (withGoal: boolean) => {
    setSaving(true);
    try {
      await startCycle({
        today: todayStr(),
        startingBalance: bal,
        commitments: commits.map((c) => ({ name: c.name, amount: Number(c.amount), kind: c.kind })),
        goal: withGoal && goal.goalName.trim() ? { ...goal, targetAmount: Number(goal.targetAmount) } : undefined,
      });
      await refresh();
      toast.success('Your 30-day runway is live 🚀');
      onCancel?.();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => (
    <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 flex items-center justify-between">
      <div><p className="text-xs text-muted-foreground">Free to spend after commitments</p><p className={`text-2xl font-bold font-mono ${free < 0 ? 'text-destructive' : 'text-primary'}`}>{inr(free)}</p></div>
      <div className="text-right"><p className="text-xs text-muted-foreground">Daily allowance</p><p className="text-xl font-bold font-mono">{inr(Math.max(0, free / 30))}</p></div>
    </div>
  ), [free]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-bold">run<span className="text-primary">way</span></span>
          {onCancel && <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-5 h-5" /></Button>}
        </div>
        <p className="text-sm text-muted-foreground">Step {step + 1} of 3</p>
        <Progress value={((step + 1) / 3) * 100} className="h-1.5 mt-2 mb-8" />
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight">How much are you working with?</h1>
                <p className="text-muted-foreground">The classic challenge is ₹10,000 for 30 days. Change it if your month looks different.</p>
                <div>
                  <Label>Starting balance (₹)</Label>
                  <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="mt-2 h-16 text-3xl font-mono font-bold" />
                  {!balValid && <p className="text-sm text-destructive mt-1">Enter a positive amount</p>}
                </div>
                <Button size="lg" className="w-full rounded-full" disabled={!balValid} onClick={() => setStep(1)}>Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <h1 className="text-4xl font-bold tracking-tight">What's already locked in?</h1>
                <p className="text-muted-foreground">Rent share, travel pass, subscriptions — anything you must pay this month.{restart && existing > 0 && ` Your ${inr(existing)} of existing subscriptions carries over.`}</p>
                <div className="space-y-2">
                  {commits.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={c.name} placeholder="Name" onChange={(e) => update(i, { name: e.target.value })} />
                      <Input value={c.amount} type="number" placeholder="₹" className="w-28 font-mono" onChange={(e) => update(i, { amount: e.target.value })} />
                      <Button variant="outline" className="w-28 shrink-0 text-xs" onClick={() => update(i, { kind: c.kind === 'Subscription' ? 'Commitment' : 'Subscription' })}>{c.kind === 'Subscription' ? '🔁 Sub' : '📌 Fixed'}</Button>
                      <Button variant="ghost" size="icon" onClick={() => setCommits((cs) => cs.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-dashed" onClick={() => setCommits((cs) => [...cs, { name: '', amount: '', kind: 'Commitment' }])}><Plus className="w-4 h-4 mr-1" /> Add commitment</Button>
                </div>
                {summary}
                {free < 0 && <p className="text-sm text-destructive">Commitments can't be more than your starting balance.</p>}
                {!commits.every((c) => c.name.trim() && Number(c.amount) > 0) && <p className="text-sm text-destructive">Each commitment needs a name and a positive amount.</p>}
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="rounded-full" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4" /></Button>
                  <Button size="lg" className="flex-1 rounded-full" disabled={!commitsValid} onClick={() => setStep(2)}>Next: pick a goal <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <h1 className="text-4xl font-bold tracking-tight">What are you saving for?</h1>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setGoal({ ...goal, emoji: e })} className={`w-12 h-12 text-2xl rounded-xl border transition ${goal.emoji === e ? 'border-primary bg-primary/15 scale-110' : 'border-border bg-card'}`}>{e}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>Goal</Label><Input className="mt-1.5" value={goal.goalName} onChange={(e) => setGoal({ ...goal, goalName: e.target.value })} /></div>
                  <div><Label>Target (₹)</Label><Input className="mt-1.5 font-mono" type="number" value={goal.targetAmount} onChange={(e) => setGoal({ ...goal, targetAmount: e.target.value })} /></div>
                  <div><Label>Deadline</Label><DateField className="mt-1.5 w-full" value={goal.deadline} onChange={(v) => setGoal({ ...goal, deadline: v })} /></div>
                </div>
                {!goalValid && <p className="text-sm text-destructive">Target must be positive</p>}
                {summary}
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="rounded-full" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="lg" disabled={saving} onClick={() => finish(false)}>Skip</Button>
                  <Button size="lg" className="flex-1 rounded-full" disabled={!goalValid || saving} onClick={() => finish(true)}>{saving ? 'Launching…' : 'Launch my runway 🚀'}</Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
