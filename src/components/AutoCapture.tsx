import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCcw, Smartphone, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { getCaptureKey, type GetCaptureKeyOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { errMsg, useReady } from '../lib/finance';

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-2">
        <code className="flex-1 min-w-0 truncate rounded-lg bg-muted px-3 py-2 text-xs font-mono">{value}</code>
        <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied'); }}><Copy className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

export default function AutoCapture() {
  const { refresh } = useReady();
  const [info, setInfo] = useState<GetCaptureKeyOutputType | null>(null);

  const load = useCallback(async (regenerate = false) => {
    try { setInfo(await getCaptureKey({ regenerate })); if (regenerate) toast.success('New key created — update it on your phone'); }
    catch (e) { toast.error(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!info) return <Skeleton className="h-64 rounded-2xl" />;
  const body = `{"key":"${info.key}","text":"%message%"}`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary/10 border border-primary/30 p-5 flex flex-wrap items-center gap-4">
        <Zap className="w-8 h-8 text-primary" />
        <div className="flex-1 min-w-[200px]">
          <p className="font-semibold">Live auto-capture</p>
          <p className="text-sm text-muted-foreground">Your phone forwards bank & UPI alerts here, and they're logged instantly.</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-mono font-bold text-lg">{info.capturedCount}</p>
          <p className="text-xs text-muted-foreground">{info.lastCaptured ? `last ${formatDistanceToNow(parseISO(info.lastCaptured))} ago` : 'nothing captured yet'}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={async () => { await load(); await refresh(); }}><RefreshCcw className="w-4 h-4 mr-1" /> Check</Button>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
        {info.webhookUrl ? <CopyRow label="Forward to this URL (POST)" value={info.webhookUrl} /> : <p className="text-sm text-accent">Auto-capture isn't switched on for this app yet — the owner needs to add the capture URL.</p>}
        <CopyRow label="Your private key (keep it secret)" value={info.key} />
        <CopyRow label="Request body (JSON)" value={body} />
        <Button size="sm" variant="outline" onClick={() => load(true)}>Regenerate key</Button>
      </div>

      <Tabs defaultValue="android">
        <TabsList><TabsTrigger value="android"><Smartphone className="w-4 h-4 mr-1.5" /> Android</TabsTrigger><TabsTrigger value="ios"><Smartphone className="w-4 h-4 mr-1.5" /> iPhone</TabsTrigger></TabsList>
        <TabsContent value="android" className="rounded-2xl bg-card border border-border p-5 text-sm space-y-2 mt-3">
          <p>1. Install <b>SMS Forwarder</b> (or any “SMS to webhook” app) from the Play Store.</p>
          <p>2. Add a rule: sender contains your bank / <b>PAYTM, GPAY, PHONEPE</b>, or text contains <b>debited</b> / <b>credited</b>.</p>
          <p>3. Action: <b>Webhook / HTTP POST</b> to the URL above, content type JSON, with the body above (use the app's message placeholder in place of <code>%message%</code>).</p>
          <p>4. Make a ₹1 UPI payment and tap <b>Check</b> — it'll show up in Spending.</p>
        </TabsContent>
        <TabsContent value="ios" className="rounded-2xl bg-card border border-border p-5 text-sm space-y-2 mt-3">
          <p>1. Open <b>Shortcuts → Automation → New → Message</b>.</p>
          <p>2. Message contains <b>debited</b> (make a second one for <b>credited</b>), set to <b>Run Immediately</b>.</p>
          <p>3. Add action <b>Get Contents of URL</b>: the URL above, Method <b>POST</b>, Request Body <b>JSON</b> with <code>key</code> = your key and <code>text</code> = <i>Shortcut Input → Message Content</i>.</p>
          <p>4. Make a ₹1 UPI payment and tap <b>Check</b>.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
