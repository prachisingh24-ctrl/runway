import { useMemo, useState } from 'react';
import { ArrowUpDown, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { deleteTransaction } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import TransactionDialog from '../components/TransactionDialog';
import type { Txn } from '../lib/engine';
import { CATEGORIES, CATEGORY_EMOJI, errMsg, inr, useReady } from '../lib/finance';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];
const PAGE = 15;

function Breakdown() {
  const { metrics } = useReady();
  const data = metrics.categories;
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <p className="font-semibold">Where it went</p>
      {total === 0 ? <p className="text-sm text-muted-foreground mt-3">No spending yet.</p> : (
        <>
          <div className="relative h-48">
            <ResponsiveContainer><PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} formatter={(v: number) => inr(v)} />
            </PieChart></ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-xs text-muted-foreground">Spent</span><span className="font-mono font-bold">{inr(total)}</span></div>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{CATEGORY_EMOJI[d.name]} {d.name}</span>
                <span className="font-mono text-muted-foreground">{Math.round((d.value / total) * 100)}% · {inr(d.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Spending() {
  const { state, refresh } = useReady();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState<'date' | 'amount'>('date');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Txn | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Txn | null>(null);

  const rows = useMemo(() => {
    let r = state.transactions.filter((t) => t.type === 'Expense' || t.type === 'Income');
    if (q) r = r.filter((t) => `${t.title} ${t.note}`.toLowerCase().includes(q.toLowerCase()));
    if (cat !== 'all') r = r.filter((t) => t.type === 'Expense' && t.category === cat);
    if (type === 'unexpected') r = r.filter((t) => t.isUnexpected);
    else if (type !== 'all') r = r.filter((t) => t.type === type);
    return [...r].sort((a, b) => (sort === 'date' ? b.date.localeCompare(a.date) : b.amount - a.amount));
  }, [state.transactions, q, cat, type, sort]);
  const shown = rows.slice(0, page * PAGE);

  const remove = async () => {
    if (!del) return;
    try { await deleteTransaction({ id: del.id }); await refresh(); toast.success('Deleted'); } catch (e) { toast.error(errMsg(e)); }
    setDel(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Spending</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => navigate('/import')}><Upload className="w-4 h-4 mr-1" /> Import</Button>
          <Button className="rounded-full" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
            <Select value={cat} onValueChange={(v) => { setCat(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="Expense">Expenses</SelectItem><SelectItem value="Income">Income</SelectItem><SelectItem value="unexpected">Unexpected</SelectItem></SelectContent></Select>
            <Button variant="outline" onClick={() => setSort(sort === 'date' ? 'amount' : 'date')}><ArrowUpDown className="w-4 h-4 mr-1" /> {sort === 'date' ? 'Newest' : 'Biggest'}</Button>
          </div>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border">
            {shown.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
            {shown.map((t) => (
              <div key={t.id} className="group p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">{t.type === 'Income' ? '💸' : t.isUnexpected ? '⚡' : CATEGORY_EMOJI[t.category] || '✨'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.type === 'Income' ? 'Income' : t.isUnexpected ? `Unexpected · ${t.category}` : t.category} · {format(parseISO(t.date), 'MMM d')}</p>
                </div>
                <span className={`font-mono text-sm ${t.type === 'Income' ? 'text-primary' : ''}`}>{t.type === 'Income' ? inr(t.amount, true) : inr(-t.amount)}</span>
                <div className="flex md:opacity-0 group-hover:opacity-100 transition">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDel(t)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
          {shown.length < rows.length && <Button variant="outline" className="w-full" onClick={() => setPage(page + 1)}>Load more ({rows.length - shown.length})</Button>}
        </div>
        <Breakdown />
      </div>
      <TransactionDialog open={open} onOpenChange={setOpen} txn={editing} />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete “{del?.title}”?</AlertDialogTitle><AlertDialogDescription>Your balance, forecast and health score will update.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
