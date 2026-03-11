import { useState } from 'react';
import api from './api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) return setError('Please fill in all fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-title">🛒 Triple Two</div>
        <div className="login-sub">Loresho POS System</div>
        {error && <div className="message message-error">{error}</div>}
        <input className="input" placeholder="Username" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <input className="input" type="password" placeholder="Password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : '🔐 Login'}
        </button>
      </div>
    </div>
  );
}
