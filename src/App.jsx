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

  // Cashier — POS + Cashier Bills
  if (user.role === 'cashier') {
    return (
      <div>
        <div style={{background:'#0f3460',padding:'8px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'white',fontWeight:'bold'}}>👤 {user.name}</span>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={() => setView('default')} style={{padding:'4px 12px',background:view==='default'||view==='pos'?'var(--accent)':'#1a1a2e',color:view==='default'||view==='pos'?'#0a0a0f':'white',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>
              💰 Cashier Bills
            </button>
            <button onClick={handleLogout} style={{padding:'4px 12px',background:'#dc2626',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>
              Logout
            </button>
          </div>
        </div>
        {view === 'default' ? <CashierBills user={user} /> : <POS user={user} onLogout={handleLogout} showBills={true} />}
      </div>
    );
  }

  // Waiter — POS only
  return <POS user={user} onLogout={handleLogout} />;
}
