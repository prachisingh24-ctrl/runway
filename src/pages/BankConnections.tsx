import { ArrowRight, Building2, CheckCircle2, CircleDashed, FileText, LockKeyhole, RefreshCw, ShieldCheck, Smartphone, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';

const steps = [
  { title: 'Choose an authorized data partner', detail: 'Select an India-ready Account Aggregator / banking-data provider and confirm Runway is eligible to access transaction data.', icon: Building2 },
  { title: 'User verifies and gives consent', detail: 'The provider handles bank discovery, authentication and explicit consent. Runway never asks for bank passwords, UPI PINs or OTPs.', icon: ShieldCheck },
  { title: 'Securely import transactions', detail: 'A server-side callback fetches authorized records, normalizes them and deduplicates them before they enter Spending.', icon: RefreshCw },
];

export default function BankConnections() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Runway · Connections</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Bank connections</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Bring eligible bank transactions into Runway so your spending, allowance and forecast can stay up to date.
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted"><WalletCards className="h-6 w-6" /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">Automatic bank sync</h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">Setup required</span>
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                No bank account is connected. Live syncing is not enabled yet because Runway does not have a configured and authorized bank-data provider.
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => navigate('/import')}>
            Import transactions for now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted/50 p-4">
            <LockKeyhole className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-semibold">Consent first</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">You approve which accounts and data can be shared, and can revoke access.</p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4">
            <Smartphone className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-semibold">Website + Android</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">A responsive connection flow can open on the website or an Android phone.</p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-semibold">No banking PINs</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Runway should never collect your bank password, UPI PIN or OTP.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">How secure sync will work</h2>
          <p className="mt-1 text-sm text-muted-foreground">The flow is designed, but the provider connection must be configured before it can go live.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><step.icon className="h-5 w-5" /></div>
                <span className="text-xs font-mono text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border p-5 md:p-6">
        <div className="flex items-center gap-2">
          <CircleDashed className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Go-live checklist</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">These items must be completed before a real account can be connected.</p>
        <ul className="mt-4 space-y-3">
          {[
            'Choose a provider and confirm Runway’s eligibility / partnership requirements.',
            'Configure server-side credentials in Zite secrets; never expose them in browser code.',
            'Implement signed callback handling, consent status, secure transaction retrieval and deduplication.',
            'Test with provider sandbox accounts, revoked consent, expired sessions and duplicate callbacks.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-full" onClick={() => window.open('https://github.com/prachisingh24-ctrl/runway/blob/main/docs/bank-sync-integration.md', '_blank', 'noopener,noreferrer')}>
            <FileText className="mr-2 h-4 w-4" /> Integration plan
          </Button>
          <Button className="rounded-full" onClick={() => navigate('/import')}>Use current import tools</Button>
        </div>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Availability depends on provider coverage and the required authorization/partnership. Phone-number verification by itself does not grant access to bank transactions. Existing manual entry, statement import and SMS parsing remain available.
      </p>
    </div>
  );
}
