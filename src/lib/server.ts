// Backend-only helpers (imported by src/api endpoints).
import { zite } from 'zitejs/db';
import type { Cycle, Goal, Sub, Txn } from './engine';

export const ownedBy = (owner: string | string[] | undefined, uid: string) =>
  Array.isArray(owner) ? owner.includes(uid) : owner === uid;

export function assertOwned<T extends { owner?: string | string[] }>(rec: T | undefined, uid: string): T {
  if (!rec || !ownedBy(rec.owner, uid)) throw new Error('Not found');
  return rec;
}

export async function getActiveCycle(uid: string): Promise<Cycle | null> {
  const { records } = await zite.budgetCycles.findAll({ filters: { owner: uid, status: 'Active' }, limit: 50 });
  const r = records.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0];
  if (!r) return null;
  return {
    id: r.id,
    cycleName: r.cycleName || 'My cycle',
    startingBalance: r.startingBalance || 0,
    startDate: r.startDate || new Date().toISOString().slice(0, 10),
    lengthDays: r.lengthDays || 30,
  };
}

export async function requireCycle(uid: string) {
  const c = await getActiveCycle(uid);
  if (!c) throw new Error('No active budget cycle');
  return c;
}

export async function loadState(uid: string) {
  const cycle = await getActiveCycle(uid);
  const [txRes, goalRes, subRes, simRes] = await Promise.all([
    cycle ? zite.transactions.findAll({ filters: { owner: uid, cycle: cycle.id }, limit: 2000 }) : Promise.resolve({ records: [] }),
    zite.savingsGoals.findAll({ filters: { owner: uid }, limit: 200 }),
    zite.subscriptions.findAll({ filters: { owner: uid }, limit: 200 }),
    zite.simulations.findAll({ filters: { owner: uid }, limit: 200 }),
  ]);
  const transactions: Txn[] = txRes.records.map((r) => ({
    id: r.id,
    title: r.title || '',
    amount: r.amount || 0,
    type: r.type || 'Expense',
    category: r.category || 'Other',
    isUnexpected: !!r.isUnexpected,
    date: r.date || cycle?.startDate || '',
    note: r.note || '',
  }));
  const goals: Goal[] = goalRes.records.map((r) => ({
    id: r.id,
    goalName: r.goalName || 'Goal',
    emoji: r.emoji || '🎯',
    targetAmount: r.targetAmount || 0,
    savedAmount: r.savedAmount || 0,
    deadline: r.deadline || '',
    completed: !!r.completed,
  }));
  const subscriptions: Sub[] = subRes.records
    .filter((r) => r.status !== 'Cancelled')
    .map((r) => ({
      id: r.id,
      name: r.name || '',
      amount: r.amount || 0,
      kind: r.kind || 'Subscription',
      nextRenewal: r.nextRenewal || '',
      status: r.status || 'Active',
    }));
  const simulations = simRes.records
    .map((r) => ({
      id: r.id,
      decision: r.decision || '',
      decisionType: r.decisionType || '',
      amount: r.amount || 0,
      scoreBefore: r.scoreBefore || 0,
      scoreAfter: r.scoreAfter || 0,
      verdict: r.verdict || 'Safe',
      committed: !!r.committed,
      created: r.created || '',
    }))
    .sort((a, b) => b.created.localeCompare(a.created));
  return { cycle, transactions, goals, subscriptions, simulations };
}
