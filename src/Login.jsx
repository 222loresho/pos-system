import { useState } from 'react';
import api from './api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#1a1a2e' }}>
      <div style={{ background:'#16213e', padding:'40px', borderRadius:'12px', width:'300px' }}>
        <h2 style={{ color:'#e94560', textAlign:'center', marginBottom:'24px' }}>POS Login</h2>
        {error && <p style={{ color:'red', textAlign:'center' }}>{error}</p>}
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ width:'100%', padding:'10px', marginBottom:'12px', borderRadius:'6px', border:'none', boxSizing:'border-box' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width:'100%', padding:'10px', marginBottom:'16px', borderRadius:'6px', border:'none', boxSizing:'border-box' }}
        />
        <button
          onClick={handleLogin}
          style={{ width:'100%', padding:'12px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'16px' }}
        >
          Login
        </button>
      </div>
    </div>
  );
}
