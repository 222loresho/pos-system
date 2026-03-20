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
    setUser(null);
    setView('default');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  // Admin — can switch between admin panel and POS
  if (user.role === 'admin' && view === 'pos') {
    return (
      <div>
        <div style={{ background:'#0f3460', padding:'8px 16px', display:'flex', justifyContent:'space-between' }}>
          <span style={{ color:'white' }}>👁️ POS View</span>
          <button onClick={() => setView('default')} style={{ padding:'4px 12px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
            ← Back to Admin
          </button>
        </div>
        <POS user={user} onLogout={handleLogout} />
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div>
        <div style={{ background:'#0f3460', padding:'8px 16px', display:'flex', justifyContent:'flex-end' }}>
          <button onClick={() => setView('pos')} style={{ padding:'4px 12px', background:'#4caf50', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
            🛒 Switch to POS
          </button>
        </div>
        <Admin user={user} onLogout={handleLogout} />
      </div>
    );
  }

  // Cashier — POS + Cashier Bills switcher
  if (user.role === 'cashier') {
    return (
      <div>
        <div style={{ background:'#0f3460', padding:'8px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'white', fontWeight:'bold' }}>👤 {user.name}</span>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => setView('pos')} style={{ padding:'4px 12px', background: view === 'pos' || view === 'default' ? '#4caf50' : '#1a1a2e', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
              🛒 POS
            </button>
            <button onClick={() => setView('bills')} style={{ padding:'4px 12px', background: view === 'bills' ? '#4caf50' : '#1a1a2e', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
              💰 Bills
            </button>
            <button onClick={handleLogout} style={{ padding:'4px 12px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
              Logout
            </button>
          </div>
        </div>
        {view === 'bills' ? <CashierBills user={user} /> : <POS user={user} onLogout={handleLogout} />}
      </div>
    );
  }

  // Waiter — POS only
  return <POS user={user} onLogout={handleLogout} />;
}
