import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format, parseISO } from 'date-fns';
import { deleteGoal, moveGoalMoney, saveGoal } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Progress } from '@project/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import DateField from '../components/DateField';
import Confetti from '../components/Confetti';
import type { Goal } from '../lib/engine';
import { errMsg, inr, useReady } from '../lib/finance';

const EMOJIS = ['🎯', '🎧', '👟', '✈️', '🎮', '🛟', '💻', '🎁', '📷', '🎸'];

function GoalDialog({ open, onOpenChange, goal }: { open: boolean; onOpenChange: (o: boolean) => void; goal: Goal | null }) {
  const { refresh } = useReady();
  const [f, setF] = useState({ goalName: '', emoji: '🎯', targetAmount: '', deadline: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setF(goal ? { ...goal, targetAmount: String(goal.targetAmount) } : { goalName: '', emoji: '🎯', targetAmount: '', deadline: format(addDays(new Date(), 30), 'yyyy-MM-dd') });
  }, [open, goal]);
  const valid = f.goalName.trim() && Number(f.targetAmount) > 0;
  const submit = async () => {
    setBusy(true);
    try { await saveGoal({ id: goal?.id, ...f, targetAmount: Number(f.targetAmount) }); await refresh(); onOpenChange(false); toast.success('Goal saved'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{goal ? 'Edit goal' : 'New goal'}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-2">{EMOJIS.map((e) => <button key={e} onClick={() => setF({ ...f, emoji: e })} className={`w-10 h-10 text-xl rounded-xl border ${f.emoji === e ? 'border-primary bg-primary/15' : 'border-border'}`}>{e}</button>)}</div>
        <div><Label>Name</Label><Input className="mt-1.5" value={f.goalName} onChange={(e) => setF({ ...f, goalName: e.target.value })} />{!f.goalName.trim() && <p className="text-xs text-destructive mt-1">Required</p>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Target (₹)</Label><Input className="mt-1.5 font-mono" type="number" value={f.targetAmount} onChange={(e) => setF({ ...f, targetAmount: e.target.value })} />{!(Number(f.targetAmount) > 0) && <p className="text-xs text-destructive mt-1">Must be positive</p>}</div>
          <div><Label>Deadline</Label><DateField className="mt-1.5 w-full" value={f.deadline} onChange={(v) => setF({ ...f, deadline: v })} /></div>
        </div>
        <Button className="w-full rounded-full" disabled={!valid || busy} onClick={submit}>{busy ? 'Saving…' : 'Save goal'}</Button>
      </DialogContent>
    </Dialog>
  );
}

function MoveDialog({ goal, dir, onClose, onComplete }: { goal: Goal | null; dir: 'add' | 'withdraw'; onClose: () => void; onComplete: (name: string) => void }) {
  const { refresh, today, metrics } = useReady();
  const [amt, setAmt] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setAmt(''), [goal]);
  const n = Number(amt);
  const max = dir === 'withdraw' ? goal?.savedAmount || 0 : Math.max(0, metrics.freeToSpend);
  const projectedEnd = metrics.forecastEnd + (dir === 'withdraw' ? (n || 0) : -(n || 0));
  const valid = n > 0 && n <= max;
  const submit = async () => {
    if (!goal) return;
    setBusy(true);
    try {
      const r = await moveGoalMoney({ goalId: goal.id, amount: n, direction: dir, today });
      await refresh(); onClose();
      if (r.justCompleted) onComplete(`${goal.emoji} ${goal.goalName} complete!`); else toast.success(dir === 'add' ? 'Saved 💪' : 'Moved back to balance');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Dialog open={!!goal} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{dir === 'add' ? 'Add to' : 'Withdraw from'} {goal?.goalName}</DialogTitle></DialogHeader>
        <Input type="number" autoFocus className="h-14 text-2xl font-mono font-bold" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <div className="space-y-1 text-xs text-muted-foreground"><p>{dir === 'add' ? `Daily allowance becomes about ${inr(Math.max(0, (metrics.freeToSpend - (n || 0)) / metrics.daysLeft))}/day` : `Up to ${inr(max)} available to withdraw`}</p><p>Estimated cycle-end forecast after this move: <span className="font-semibold text-foreground">{projectedEnd < 0 ? '−' : ''}{inr(projectedEnd)}</span></p></div>
        {amt && !valid && <p className="text-xs text-destructive">Enter between ₹1 and {inr(max)}</p>}
        <Button className="w-full rounded-full" disabled={!valid || busy} onClick={submit}>{busy ? '…' : 'Confirm'}</Button>
      </DialogContent>
    </Dialog>
  );
}

export default function Goals() {
  const { state, metrics, refresh, today } = useReady();
  const [edit, setEdit] = useState<{ open: boolean; goal: Goal | null }>({ open: false, goal: null });
  const [move, setMove] = useState<{ goal: Goal | null; dir: 'add' | 'withdraw' }>({ goal: null, dir: 'add' });
  const [del, setDel] = useState<Goal | null>(null);
  const [party, setParty] = useState('');

  const remove = async () => {
    if (!del) return;
    try { await deleteGoal({ id: del.id, today }); await refresh(); toast.success('Goal removed, savings returned'); } catch (e) { toast.error(errMsg(e)); }
    setDel(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold tracking-tight">Goals</h1><p className="text-sm text-muted-foreground">Money you save leaves your spendable balance — that's the trade-off.</p></div>
        <Button className="rounded-full" onClick={() => setEdit({ open: true, goal: null })}><Plus className="w-4 h-4 mr-1" /> New goal</Button>
      </div>
      {state.goals.length > 0 && <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Saved across goals</p><p className="mt-1 text-2xl font-bold font-mono">{inr(state.goals.reduce((sum, g) => sum + g.savedAmount, 0))}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Still needed</p><p className="mt-1 text-2xl font-bold font-mono">{inr(state.goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.savedAmount), 0))}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Current cycle-end forecast</p><p className="mt-1 text-2xl font-bold font-mono">{metrics.forecastEnd < 0 ? '−' : ''}{inr(metrics.forecastEnd)}</p><p className="mt-1 text-xs text-muted-foreground">A new contribution reduces spendable cash by the same amount.</p></div>
      </div>}
      {state.goals.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No goals yet. What are you saving for?</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {state.goals.map((g, i) => {
          const s = metrics.goals.find((x) => x.id === g.id)!;
          const tone = s.status === 'Done' ? 'text-primary' : s.status === 'On track' ? 'text-primary' : 'text-accent';
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><span className="text-3xl">{g.emoji}</span><div><p className="font-semibold">{g.goalName}</p><p className="text-xs text-muted-foreground">{g.deadline ? `by ${format(parseISO(g.deadline), 'MMM d')}` : 'No deadline'}</p></div></div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEdit({ open: true, goal: g })}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDel(g)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-4 font-mono"><span className="text-2xl font-bold">{inr(g.savedAmount)}</span><span className="text-muted-foreground"> / {inr(g.targetAmount)}</span></p>
              <Progress value={s.progress * 100} className="h-2.5 mt-2" />
              <p className={`mt-2 text-sm ${tone}`}>{s.status === 'Done' ? '🏆 Completed' : `${s.status} · add ${inr(s.requiredPerDay)}/day`}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1 rounded-full" onClick={() => setMove({ goal: g, dir: 'add' })}><Plus className="w-4 h-4 mr-1" /> Add money</Button>
                <Button size="sm" variant="outline" className="rounded-full" disabled={g.savedAmount <= 0} onClick={() => setMove({ goal: g, dir: 'withdraw' })}><Minus className="w-4 h-4 mr-1" /> Withdraw</Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      <GoalDialog open={edit.open} goal={edit.goal} onOpenChange={(o) => setEdit({ ...edit, open: o })} />
      <MoveDialog goal={move.goal} dir={move.dir} onClose={() => setMove({ ...move, goal: null })} onComplete={setParty} />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete “{del?.goalName}”?</AlertDialogTitle><AlertDialogDescription>{inr(del?.savedAmount || 0)} saved will go back to your balance.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Confetti show={!!party} message={party} onDone={() => setParty('')} />
    </div>
  );
}
