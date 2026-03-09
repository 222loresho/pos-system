import { useState } from 'react';
import Login from './Login';
import POS from './POS';
import Admin from './Admin';

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

  if (user.role === 'admin') return <Admin user={user} onLogout={handleLogout} />;

  return <POS user={user} onLogout={handleLogout} />;
}
