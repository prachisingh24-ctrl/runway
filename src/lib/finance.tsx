import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { getOverview } from 'zitejs/api';
import { compute, type Cycle, type EngineInput, type Goal, type Metrics, type Sub, type Txn } from './engine';

export type Simulation = {
  id: string; decision: string; decisionType: string; amount: number;
  scoreBefore: number; scoreAfter: number; verdict: string; committed: boolean; created: string;
};
type State = { cycle: Cycle | null; transactions: Txn[]; goals: Goal[]; subscriptions: Sub[]; simulations: Simulation[] };

type Ctx = {
  loading: boolean;
  state: State;
  input: EngineInput | null;
  metrics: Metrics | null;
  today: string;
  refresh: () => Promise<void>;
};

const FinanceContext = createContext<Ctx | null>(null);
export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<State>({ cycle: null, transactions: [], goals: [], subscriptions: [], simulations: [] });
  const today = todayStr();

  const refresh = useCallback(async () => {
    const data = (await getOverview({})) as State;
    setState(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  const input = useMemo<EngineInput | null>(
    () => (state.cycle ? { ...state, cycle: state.cycle, today, simulationCount: state.simulations.length } : null),
    [state, today],
  );
  const metrics = useMemo(() => (input ? compute(input) : null), [input]);

  return <FinanceContext.Provider value={{ loading, state, input, metrics, today, refresh }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const c = useContext(FinanceContext);
  if (!c) throw new Error('useFinance outside provider');
  return c;
}

/** For pages rendered inside the app shell, where a cycle always exists. */
export function useReady() {
  const c = useFinance();
  return { ...c, input: c.input!, metrics: c.metrics!, cycle: c.state.cycle! };
}

export const inr = (n: number, signed = false) => {
  const s = `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;
  if (n < 0) return `−${s}`;
  return signed ? `+${s}` : s;
};

export const CATEGORIES = ['Food', 'Transport', 'Fun', 'Shopping', 'Bills', 'Education', 'Health', 'Other'];
export const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍕', Transport: '🛺', Fun: '🎉', Shopping: '🛍️', Bills: '🧾', Education: '📚', Health: '💊', Other: '✨',
};

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
