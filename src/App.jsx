import { useState } from 'react';
import Login from './Login';
import POS from './POS';
import Admin from './Admin';
import CashierBills from './CashierBills';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState('default');

  const handleLogin = (userData) => {
    setUser(userData);
    setView('default');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userpin');
    setUser(null);
    setView('default');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  // Admin
  if (user.role === 'admin' && view === 'pos') {
    return <POS user={user} onLogout={handleLogout} onSwitchToBills={() => setView('default')} />;
  }
  if (user.role === 'admin') {
    return <Admin user={user} onLogout={handleLogout} onSwitchToPOS={() => setView('pos')} />;
  }

  // Cashier
  if (user.role === 'cashier') {
    if (view === 'bills') {
      return <CashierBills user={user} onLogout={handleLogout} onSwitchToPOS={() => setView('default')} />;
    }
    return <POS user={user} onLogout={handleLogout} showBills={true} onSwitchToBills={() => setView('bills')} />;
  }

  // Waiter
  return <POS user={user} onLogout={handleLogout} />;
}
