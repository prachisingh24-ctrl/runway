import { motion } from 'framer-motion';
import type { Risk } from '../lib/engine';
import { cn } from '@project/components/lib/utils';

export function ScoreRing({ score, size = 160, label }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const color = score >= 65 ? 'hsl(var(--primary))' : score >= 45 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={12} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={12} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold" style={{ fontSize: size / 4 }}>{score}</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

const RISK_STYLE: Record<Risk, string> = {
  Low: 'bg-primary/15 text-primary border-primary/30',
  Medium: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  High: 'bg-accent/15 text-accent border-accent/30',
  Critical: 'bg-destructive/15 text-destructive border-destructive/40',
};
export function RiskBadge({ risk, className }: { risk: Risk; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', RISK_STYLE[risk], className)}>{risk} risk</span>;
}
