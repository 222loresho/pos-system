import { useState } from 'react';
import api from './api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (pinValue) => {
    if (!username.trim()) { setError('❌ Enter your username first'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/pin-login', { username: username.trim(), pin: pinValue });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('userpin', pinValue);
      onLogin(res.data.user);
    } catch (e) {
      setError(e.response?.data?.error || '❌ Login failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePinPress = (k) => {
    if (loading) return;
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (k === 'C') { setPin(''); setError(''); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) doLogin(next);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '340px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛒</div>
          <h1 style={{ color: 'var(--accent)', fontSize: '22px', margin: 0,  }}>Javari</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '4px 0 0' }}>Point of Sale</p>
        </div>

        <div className="card">
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
          />

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Enter PIN</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: '48px', height: '48px', border: `2px solid ${pin.length > i ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', background: 'var(--surface)', transition: 'all 0.2s' }}>
                  {pin[i] ? '●' : ''}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[1,2,3,4,5,6,7,8,9,'C',0,'⌫'].map((k, i) => (
                <button key={i}
                  onClick={() => handlePinPress(String(k))}
                  disabled={loading}
                  style={{
                    padding: '14px',
                    fontSize: k === 'C' || k === '⌫' ? '16px' : '20px',
                    fontWeight: 'bold',
                    background: 'var(--card)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    
                  }}
                >{k}</button>
              ))}
            </div>
          </div>

          {error && <div className="message message-error">{error}</div>}
          {loading && <div className="message message-success">🔄 Logging in...</div>}
        </div>
      </div>
    </div>
  );
}
