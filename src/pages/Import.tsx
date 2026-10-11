import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, MessageSquareText, Upload, Zap } from 'lucide-react';
import AutoCapture from '../components/AutoCapture';
import { toast } from 'sonner';
import { importTransactions } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Textarea } from '@project/components/ui/textarea';
import { Checkbox } from '@project/components/ui/checkbox';
import { Input } from '@project/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { parseSms, parseStatement, type Draft } from '../lib/importers';
import { CATEGORIES, CATEGORY_EMOJI, errMsg, inr, useReady } from '../lib/finance';

const SAMPLE = `Rs.249.00 debited from A/c XX1234 on 09-Oct-26 to VPA swiggy@icici. UPI Ref 4561. -HDFC Bank
You have received Rs 1500 from Rahul on 08/10/26 via Google Pay
Paid Rs.120 to Rapido via Paytm on 10-10-2026`;

function Review({ drafts, setDrafts, onImport, busy }: { drafts: Draft[]; setDrafts: (d: Draft[]) => void; onImport: () => void; busy: boolean }) {
  const upd = (k: string, p: Partial<Draft>) => setDrafts(drafts.map((d) => (d.key === k ? { ...d, ...p } : d)));
  const chosen = drafts.filter((d) => d.include);
  const out = chosen.filter((d) => d.type === 'Expense').reduce((a, d) => a + d.amount, 0);
  const inn = chosen.filter((d) => d.type === 'Income').reduce((a, d) => a + d.amount, 0);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm"><b>{chosen.length}</b> of {drafts.length} selected · <span className="font-mono">{inr(-out)}</span> out · <span className="font-mono text-primary">{inr(inn, true)}</span> in</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDrafts(drafts.map((d) => ({ ...d, include: chosen.length !== drafts.length })))}>{chosen.length === drafts.length ? 'Select none' : 'Select all'}</Button>
          <Button className="rounded-full" disabled={!chosen.length || busy} onClick={onImport}>{busy ? 'Importing…' : `Import ${chosen.length}`}</Button>
        </div>
      </div>
      <div className="rounded-2xl bg-card border border-border divide-y divide-border max-h-[480px] overflow-auto">
        {drafts.map((d) => (
          <div key={d.key} className={`p-3 flex flex-wrap items-center gap-2 ${d.include ? '' : 'opacity-40'}`}>
            <Checkbox checked={d.include} onCheckedChange={(v) => upd(d.key, { include: !!v })} />
            <Input value={d.title} onChange={(e) => upd(d.key, { title: e.target.value })} className="flex-1 min-w-[140px] h-9" />
            <span className="text-xs text-muted-foreground w-20">{d.date}</span>
            <Select value={d.type} onValueChange={(v) => upd(d.key, { type: v as Draft['type'] })}><SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Expense">Expense</SelectItem><SelectItem value="Income">Income</SelectItem></SelectContent></Select>
            {d.type === 'Expense' && <Select value={d.category} onValueChange={(v) => upd(d.key, { category: v })}><SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</SelectItem>)}</SelectContent></Select>}
            <span className={`font-mono text-sm w-24 text-right ${d.type === 'Income' ? 'text-primary' : ''}`}>{d.type === 'Income' ? inr(d.amount, true) : inr(-d.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Import() {
  const { today, refresh, cycle } = useReady();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [source, setSource] = useState('');
  const [sms, setSms] = useState('');
  const [busy, setBusy] = useState(false);

  const load = (list: Draft[], src: string) => {
    const inCycle = list.map((d) => ({ ...d, include: d.date >= cycle.startDate }));
    if (!list.length) toast.error('No transactions found'); else toast.success(`Found ${list.length} transactions — review below`);
    setDrafts(inCycle); setSource(src);
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    try { load(await parseStatement(f, today), 'bank statement'); } catch (e) { toast.error(errMsg(e)); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const doImport = async () => {
    setBusy(true);
    try {
      const r = await importTransactions({ source, records: drafts.filter((d) => d.include).map(({ title, amount, type, category, date }) => ({ title, amount, type, category, date })) });
      await refresh();
      toast.success(`Imported ${r.imported}${r.skipped ? ` · skipped ${r.skipped} duplicates` : ''}`);
      nav('/spending');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Import transactions</h1><p className="text-sm text-muted-foreground">Bring in spending from your bank, Paytm, Google Pay or PhonePe. You review everything before it's saved.</p></div>
      <Tabs defaultValue="live">
        <TabsList><TabsTrigger value="live"><Zap className="w-4 h-4 mr-1.5" /> Live capture</TabsTrigger><TabsTrigger value="file"><FileSpreadsheet className="w-4 h-4 mr-1.5" /> Bank statement</TabsTrigger><TabsTrigger value="sms"><MessageSquareText className="w-4 h-4 mr-1.5" /> Paste SMS</TabsTrigger></TabsList>
        <TabsContent value="live" className="mt-4"><AutoCapture /></TabsContent>
        <TabsContent value="file" className="mt-4">
          <button onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
            className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/60 transition p-10 flex flex-col items-center gap-2 text-center">
            <Upload className="w-8 h-8 text-primary" /><p className="font-semibold">Drop your statement here or tap to choose</p>
            <p className="text-xs text-muted-foreground">CSV, XLS or XLSX · download it from your bank's net banking or app (Statements → Download)</p>
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </TabsContent>
        <TabsContent value="sms" className="mt-4 space-y-3">
          <Textarea rows={7} value={sms} onChange={(e) => setSms(e.target.value)} placeholder={SAMPLE} className="font-mono text-xs" />
          <div className="flex gap-2">
            <Button className="rounded-full" disabled={!sms.trim()} onClick={() => load(parseSms(sms, today), 'SMS')}>Read messages</Button>
            <Button variant="ghost" onClick={() => setSms(SAMPLE)}>Try sample</Button>
          </div>
          <p className="text-xs text-muted-foreground">Copy debit/credit alerts from your Messages app — one per line.</p>
        </TabsContent>
      </Tabs>
      {drafts.length > 0 && <Review drafts={drafts} setDrafts={setDrafts} onImport={doImport} busy={busy} />}
      {drafts.length > 0 && <p className="text-xs text-muted-foreground">Entries dated before this cycle started are unticked. Exact duplicates are skipped automatically.</p>}
    </div>
  );
}
