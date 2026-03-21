import { useState } from 'react';
import api from './api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || pin.length < 4) return setError('❌ Enter username and 4-digit PIN');
    setLoading(true);
    try {
      const res = await api.post('/auth/pin-login', { username, pin });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('userpin', pin);
      onLogin(res.data.user);
    } catch (e) {
      setError(e.response?.data?.error || '❌ Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePinPress = (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 4) setPin(p => p + k);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '340px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛒</div>
          <h1 style={{ color: 'var(--accent)', fontSize: '22px', margin: 0 }}>Javari</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '4px 0 0' }}>Point of Sale</p>
        </div>

        <div className="card">
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoCapitalize="none"
          />

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Enter PIN</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: '48px', height: '48px', border: `2px solid ${pin.length > i ? 'var(--accent)' : 'var(--card)'}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', background: 'var(--surface)', transition: 'border-color 0.2s' }}>
                  {pin[i] ? '●' : ''}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                <button key={i}
                  onClick={() => k !== '' && handlePinPress(String(k))}
                  style={{
                    padding: '14px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: k === '' ? 'transparent' : 'var(--card)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: k === '' ? 'default' : 'pointer',
                    opacity: k === '' ? 0 : 1
                  }}
                >{k}</button>
              ))}
            </div>
          </div>

          {error && <div className="message message-error">{error}</div>}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '8px' }}
            onClick={handleLogin}
            disabled={loading || pin.length < 4 || !username}
          >
            {loading ? 'Logging in...' : '🔓 Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
