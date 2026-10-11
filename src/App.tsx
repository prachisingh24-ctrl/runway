import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from 'zitejs/auth';
import { Toaster } from '@project/components/ui/sonner';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Spending from './pages/Spending';
import Simulator from './pages/Simulator';
import Goals from './pages/Goals';
import Subscriptions from './pages/Subscriptions';
import Health from './pages/Health';
import Import from './pages/Import';
import BankConnections from './pages/BankConnections';
import AppShell from './components/AppShell';
import Splash from './components/Splash';
import { FinanceProvider, useFinance } from './lib/finance';

function SignedIn() {
  const { loading, state } = useFinance();
  if (loading) return <Splash />;
  if (!state.cycle) return <Setup />;
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/spending" element={<Spending />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/health" element={<Health />} />
          <Route path="/import" element={<Import />} />
          <Route path="/connections" element={<BankConnections />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      {isLoading ? <Splash /> : !user ? <Landing /> : (
        <FinanceProvider>
          <SignedIn />
        </FinanceProvider>
      )}
      <Toaster richColors position="top-center" />
    </>
  );
}
