import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, FlaskConical, MoreVertical, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { saveSubscription, subscriptionAction } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Badge } from '@project/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import DateField from '../components/DateField';
import type { Sub } from '../lib/engine';
import { errMsg, inr, useReady } from '../lib/finance';

function SubDialog({ open, onOpenChange, sub }: { open: boolean; onOpenChange: (o: boolean) => void; sub: Sub | null }) {
  const { refresh, today } = useReady();
  const [f, setF] = useState({ name: '', amount: '', kind: 'Subscription' as 'Subscription' | 'Commitment', nextRenewal: today });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setF(sub ? { name: sub.name, amount: String(sub.amount), kind: sub.kind as 'Subscription' | 'Commitment', nextRenewal: sub.nextRenewal || today } : { name: '', amount: '', kind: 'Subscription', nextRenewal: today });
  }, [open, sub, today]);
  const valid = f.name.trim() && Number(f.amount) > 0 && f.nextRenewal;
  const submit = async () => {
    setBusy(true);
    try { await saveSubscription({ id: sub?.id, ...f, amount: Number(f.amount) }); await refresh(); onOpenChange(false); toast.success('Saved'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{sub ? 'Edit' : 'Add'} recurring cost</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
          {(['Subscription', 'Commitment'] as const).map((k) => <button key={k} onClick={() => setF({ ...f, kind: k })} className={`py-2 rounded-lg text-sm font-semibold ${f.kind === k ? 'bg-background shadow' : 'text-muted-foreground'}`}>{k === 'Subscription' ? '🔁 Subscription' : '📌 Fixed commitment'}</button>)}
        </div>
        <div><Label>Name</Label><Input className="mt-1.5" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Monthly (₹)</Label><Input className="mt-1.5 font-mono" type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
          <div><Label>Next due</Label><DateField className="mt-1.5 w-full" value={f.nextRenewal} onChange={(v) => setF({ ...f, nextRenewal: v })} /></div>
        </div>
        {!valid && <p className="text-xs text-destructive">Name, positive amount and due date required</p>}
        <Button className="w-full rounded-full" disabled={!valid || busy} onClick={submit}>{busy ? 'Saving…' : 'Save'}</Button>
      </DialogContent>
    </Dialog>
  );
}

export default function Subscriptions() {
  const { state, metrics, refresh, today } = useReady();
  const nav = useNavigate();
  const [dlg, setDlg] = useState<{ open: boolean; sub: Sub | null }>({ open: false, sub: null });
  const [del, setDel] = useState<Sub | null>(null);
  const subs = [...state.subscriptions].sort((a, b) => (a.status === b.status ? a.nextRenewal.localeCompare(b.nextRenewal) : a.status === 'Active' ? -1 : 1));
  const daysOfAllowance = metrics.dailyAllowance > 0 ? Math.round(metrics.monthlyCommitments / metrics.dailyAllowance) : 0;

  const act = async (s: Sub, action: 'pay' | 'pause' | 'resume' | 'delete') => {
    try {
      await subscriptionAction({ id: s.id, action, today });
      await refresh();
      toast.success({ pay: `Paid ${s.name} — next due in a month`, pause: 'Paused — removed from forecast', resume: 'Resumed', delete: 'Removed' }[action]);
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions & commitments</h1>
        <Button className="rounded-full" onClick={() => setDlg({ open: true, sub: null })}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-accent text-accent-foreground p-5"><p className="text-xs opacity-80">Locked in each month</p><p className="text-3xl font-bold font-mono">{inr(metrics.monthlyCommitments)}</p></div>
        <div className="rounded-2xl bg-card border border-border p-5"><p className="text-xs text-muted-foreground">Still due this cycle</p><p className="text-3xl font-bold font-mono">{inr(metrics.upcoming)}</p></div>
        <div className="rounded-2xl bg-card border border-border p-5"><p className="text-xs text-muted-foreground">That's</p><p className="text-3xl font-bold font-mono">{daysOfAllowance} days</p><p className="text-xs text-muted-foreground">of your allowance</p></div>
      </div>
      <div className="rounded-2xl bg-card border border-border divide-y divide-border">
        {subs.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No recurring costs. Lucky you.</p>}
        {subs.map((s) => {
          const overdue = s.status === 'Active' && s.nextRenewal && s.nextRenewal <= today;
          return (
            <div key={s.id} className={`p-4 flex items-center gap-3 ${s.status === 'Paused' ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">{s.kind === 'Subscription' ? '🔁' : '📌'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.name} {s.status === 'Paused' && <Badge variant="secondary" className="ml-1">Paused</Badge>}</p>
                <p className={`text-xs ${overdue ? 'text-accent' : 'text-muted-foreground'}`}>{s.nextRenewal ? `${overdue ? 'Due' : 'Renews'} ${format(parseISO(s.nextRenewal), 'MMM d')}` : 'No date'} · {s.kind}</p>
              </div>
              <span className="font-mono">{inr(s.amount)}</span>
              {s.status === 'Active' && <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={() => act(s, 'pay')}><CheckCheck className="w-4 h-4 mr-1" /> Paid</Button>}
              {s.status === 'Active' && <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={() => nav(`/simulator?type=Cancel Subscription&sub=${s.id}`)}><FlaskConical className="w-4 h-4 mr-1" /> Simulate cancel</Button>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {s.status === 'Active' && <DropdownMenuItem className="sm:hidden" onClick={() => act(s, 'pay')}><CheckCheck className="w-4 h-4 mr-2" /> Mark paid</DropdownMenuItem>}
                  {s.status === 'Active' && <DropdownMenuItem className="sm:hidden" onClick={() => nav(`/simulator?type=Cancel Subscription&sub=${s.id}`)}><FlaskConical className="w-4 h-4 mr-2" /> Simulate cancel</DropdownMenuItem>}
                  {s.status === 'Active' ? <DropdownMenuItem onClick={() => act(s, 'pause')}><Pause className="w-4 h-4 mr-2" /> Pause</DropdownMenuItem>
                    : <DropdownMenuItem onClick={() => act(s, 'resume')}><Play className="w-4 h-4 mr-2" /> Resume</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => setDlg({ open: true, sub: s })}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDel(s)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
      <SubDialog open={dlg.open} sub={dlg.sub} onOpenChange={(o) => setDlg({ ...dlg, open: o })} />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {del?.name}?</AlertDialogTitle><AlertDialogDescription>It'll be removed from your forecast.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (del) act(del, 'delete'); setDel(null); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
