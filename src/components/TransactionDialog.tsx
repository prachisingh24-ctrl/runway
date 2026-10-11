import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { saveTransaction } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Switch } from '@project/components/ui/switch';
import { Textarea } from '@project/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import type { Txn } from '../lib/engine';
import { CATEGORIES, CATEGORY_EMOJI, errMsg, inr, todayStr, useFinance } from '../lib/finance';
import DateField from './DateField';

type Props = { open: boolean; onOpenChange: (o: boolean) => void; txn?: Txn | null };
const blank = () => ({ title: '', amount: '', type: 'Expense' as 'Expense' | 'Income', category: 'Food', isUnexpected: false, date: todayStr(), note: '' });

export default function TransactionDialog({ open, onOpenChange, txn }: Props) {
  const { refresh, metrics } = useFinance();
  const [f, setF] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setF(txn ? { ...txn, amount: String(txn.amount), type: txn.type as 'Expense' | 'Income' } : blank());
  }, [open, txn]);

  const amount = Number(f.amount);
  const errors = { title: !f.title.trim() ? 'Give it a name' : '', amount: !(amount > 0) ? 'Enter a positive amount' : '' };
  const valid = !errors.title && !errors.amount && !!f.date;
  const allowance = metrics?.dailyAllowance ?? 0;

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    try {
      await saveTransaction({ id: txn?.id, ...f, amount });
      await refresh();
      toast.success(txn ? 'Updated' : f.type === 'Income' ? 'Income added 💸' : 'Logged');
      onOpenChange(false);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{txn ? 'Edit entry' : 'Log money'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
          {(['Expense', 'Income'] as const).map((t) => (
            <button key={t} onClick={() => setF({ ...f, type: t })} className={`py-2 rounded-lg text-sm font-semibold transition ${f.type === t ? 'bg-background shadow' : 'text-muted-foreground'}`}>{t}</button>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <Label>Amount (₹)</Label>
            <Input type="number" autoFocus value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="mt-1.5 h-14 text-2xl font-mono font-bold" />
            {touched && errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
            {f.type === 'Expense' && amount > 0 && allowance > 0 && (
              <p className="text-xs text-muted-foreground mt-1">That's {(amount / allowance).toFixed(1)} days of your {inr(allowance)} allowance</p>
            )}
          </div>
          <div>
            <Label>What for?</Label>
            <Input value={f.title} placeholder={f.type === 'Income' ? 'Pocket money, freelance gig…' : 'Swiggy, auto, movie…'} onChange={(e) => setF({ ...f, title: e.target.value })} className="mt-1.5" />
            {touched && errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {f.type === 'Expense' && (
              <div>
                <Label>Category</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className={f.type === 'Income' ? 'col-span-2' : ''}><Label>Date</Label><DateField className="mt-1.5 w-full" value={f.date} onChange={(v) => setF({ ...f, date: v })} /></div>
          </div>
          {f.type === 'Expense' && (
            <label className="flex items-center justify-between rounded-xl border border-border p-3 cursor-pointer">
              <span className="text-sm"><b>⚡ Unexpected expense</b><br /><span className="text-muted-foreground text-xs">Phone repair, medical, fines…</span></span>
              <Switch checked={f.isUnexpected} onCheckedChange={(v) => setF({ ...f, isUnexpected: v })} />
            </label>
          )}
          <div><Label>Note (optional)</Label><Textarea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className="mt-1.5" /></div>
        </div>
        <Button size="lg" className="w-full rounded-full" disabled={saving || (touched && !valid)} onClick={submit}>{saving ? 'Saving…' : txn ? 'Save changes' : 'Add'}</Button>
      </DialogContent>
    </Dialog>
  );
}
