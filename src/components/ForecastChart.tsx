import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Metrics } from '../lib/engine';

export default function ForecastChart({ series, compare }: { series: Metrics['series']; compare?: Metrics['series'] }) {
  const data = series.map((p, i) => ({ ...p, alt: compare?.[i]?.forecast ?? null }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={4} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
        <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} formatter={(v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`} />
        <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
        <Area type="monotone" dataKey="actual" name="Actual" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gA)" connectNulls={false} />
        <Area type="monotone" dataKey="forecast" name="Forecast" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="6 4" fill="none" />
        {compare && <Area type="monotone" dataKey="alt" name="If you do it" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="2 3" fill="none" />}
      </AreaChart>
    </ResponsiveContainer>
  );
}
