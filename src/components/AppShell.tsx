import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FlaskConical, HeartPulse, LayoutDashboard, Link2, LogOut, PiggyBank, Plus, Receipt, RefreshCcw, Repeat } from 'lucide-react';
import { logout, useAuth } from 'zitejs/auth';
import { Button } from '@project/components/ui/button';
import { Avatar, AvatarFallback } from '@project/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { cn } from '@project/components/lib/utils';
import TransactionDialog from './TransactionDialog';
import Setup from '../pages/Setup';
import { useReady } from '../lib/finance';

const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/spending', label: 'Spending', icon: Receipt },
  { to: '/connections', label: 'Banks', icon: Link2 },
  { to: '/simulator', label: 'Simulator', icon: FlaskConical },
  { to: '/goals', label: 'Goals', icon: PiggyBank },
  { to: '/subscriptions', label: 'Subs', icon: Repeat },
  { to: '/health', label: 'Health', icon: HeartPulse },
];

function UserMenu({ onRestart }: { onRestart: () => void }) {
  const { user } = useAuth();
  const initials = (user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full"><Avatar className="w-9 h-9"><AvatarFallback className="bg-accent text-accent-foreground font-bold">{initials}</AvatarFallback></Avatar></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onRestart}><RefreshCcw className="w-4 h-4 mr-2" /> Start a new cycle</DropdownMenuItem>
        <DropdownMenuItem onClick={() => logout()}><LogOut className="w-4 h-4 mr-2" /> Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppShell() {
  const { metrics } = useReady();
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [restarting, setRestarting] = useState(false);

  if (restarting) return <Setup restart onCancel={() => setRestarting(false)} />;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar p-5 sticky top-0 h-screen">
        <span className="text-2xl font-bold tracking-tight px-2">run<span className="text-primary">way</span></span>
        <nav className="mt-8 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground')}>
              <n.icon className="w-4 h-4" /> {n.label === 'Subs' ? 'Subscriptions' : n.label === 'Home' ? 'Dashboard' : n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-sidebar-accent p-4">
          <p className="text-xs text-muted-foreground">Day {metrics.day} of {metrics.length}</p>
          <div className="mt-2 h-1.5 rounded-full bg-background overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(metrics.day / metrics.length) * 100}%` }} /></div>
          <p className="mt-2 text-xs">{metrics.daysLeft} days left</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border px-4 md:px-8 py-3 flex items-center justify-between">
          <span className="md:hidden text-xl font-bold">run<span className="text-primary">way</span></span>
          <div className="hidden md:block text-sm text-muted-foreground">Balance <span className="font-mono font-bold text-foreground ml-1">₹{Math.round(metrics.balance).toLocaleString('en-IN')}</span></div>
          <div className="flex items-center gap-3">
            <Button className="hidden md:inline-flex rounded-full" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" /> Log money</Button>
            <UserMenu onRestart={() => setConfirm(true)} />
          </div>
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 pb-28 md:pb-10 max-w-6xl w-full mx-auto"><Outlet /></main>
      </div>

      <button onClick={() => setAddOpen(true)} className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center" aria-label="Log money"><Plus className="w-6 h-6" /></button>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-sidebar border-t border-sidebar-border grid grid-cols-7">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('min-w-0 flex flex-col items-center gap-1 py-2.5 text-[10px]', isActive ? 'text-primary' : 'text-muted-foreground')}>
            <n.icon className="w-5 h-5 shrink-0" />
            <span className="block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-center px-0.5">{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <TransactionDialog open={addOpen} onOpenChange={setAddOpen} />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a fresh 30-day cycle?</AlertDialogTitle>
            <AlertDialogDescription>Your current cycle will be archived. Goals and subscriptions carry over; spending resets.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setRestarting(true)}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
