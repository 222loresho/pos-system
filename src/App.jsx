import { useState } from 'react';
import Login from './Login';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ background:'#1a1a2e', minHeight:'100vh', color:'white', padding:'20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ color:'#e94560' }}>POS System</h1>
        <div>
          <span style={{ marginRight:'16px' }}>👤 {user.name}</span>
          <button onClick={handleLogout} style={{ padding:'8px 16px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
            Logout
          </button>
        </div>
      </div>
      <h2>Welcome, {user.name}! 🎉</h2>
      <p>POS Dashboard coming next...</p>
    </div>
  );
}
