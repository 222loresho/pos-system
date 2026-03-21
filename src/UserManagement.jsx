import { useState, useEffect } from 'react';
import api from './api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', role: 'cashier', pin: '' });

  const fetchUsers = () => api.get('/users/').then(res => setUsers(res.data)).catch(() => setMessage('❌ Failed to load users'));
  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => { setForm({ name: '', username: '', role: 'cashier', pin: '' }); setEditUser(null); setShowForm(false); setMessage(''); };

  const saveUser = async () => {
    if (!form.name.trim() || !form.username.trim()) return setMessage('❌ Name and username required!');
    if (!form.pin && !editUser) return setMessage('❌ PIN required!');
    if (form.pin && (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin))) return setMessage('❌ PIN must be exactly 4 digits!');
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
        setMessage('✅ User updated!');
      } else {
        await api.post('/users/', form);
        setMessage('✅ User created!');
      }
      resetForm(); fetchUsers();
    } catch (e) {
      setMessage('❌ ' + (e.response?.data?.error || 'Failed'));
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { active: !user.active });
      fetchUsers();
      setMessage(`✅ ${user.name} ${!user.active ? 'activated' : 'deactivated'}!`);
    } catch { setMessage('❌ Failed'); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      setMessage('✅ User deleted!');
      fetchUsers();
    } catch (e) { setMessage('❌ ' + (e.response?.data?.error || 'Failed')); }
  };

  const startEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, username: user.username, role: user.role, pin: '' });
    setShowForm(true);
    setMessage('');
  };

  const roleColor = (role) => role === 'admin' ? '#e94560' : role === 'waiter' ? '#f0a500' : 'var(--accent)';

  return (
    <div>
      <div className="flex-between mb-8">
        <div className="section-title" style={{ margin: 0 }}>👥 User Management</div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm && !editUser ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {message && <div className={`message ${message.startsWith('❌') ? 'message-error' : 'message-success'}`}>{message}</div>}

      {showForm && (
        <div className="card" style={{ border: '1px solid var(--accent)', marginBottom: '16px' }}>
          <div className="section-title">{editUser ? '✏️ Edit User' : '➕ New User'}</div>
          <input className="input" placeholder="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Username *" value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} disabled={!!editUser} />
          <input className="input" type="number" placeholder={editUser ? 'New PIN (leave blank to keep)' : '4-digit PIN *'} maxLength={4} value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value.slice(0, 4) })} />
          <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="cashier">💰 Cashier</option>
            <option value="admin">👑 Admin</option>
            <option value="waiter">🤵 Waiter</option>
          </select>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={saveUser}>{editUser ? '💾 Save Changes' : '✅ Create User'}</button>
            <button className="btn btn-muted" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {users.length === 0 && !message && <p className="text-muted">No users found</p>}
      {users.map(u => (
        <div key={u.id} className="admin-item" style={{ opacity: u.active ? 1 : 0.5 }}>
          <div>
            <div className="flex gap-8" style={{ alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="admin-item-info">{u.name}</span>
              <span style={{ background: roleColor(u.role), color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                {u.role.toUpperCase()}
              </span>
              {!u.active && <span style={{ background: '#555', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>INACTIVE</span>}
            </div>
            <div className="admin-item-sub">@{u.username} · PIN: {u.pin || '----'}</div>
          </div>
          <div className="admin-item-actions">
            <button className="btn btn-sm" style={{ background: 'var(--card)', color: 'white' }} onClick={() => startEdit(u)}>✏️</button>
            <button className="btn btn-sm" style={{ background: u.active ? '#555' : '#4caf50', color: 'white' }} onClick={() => toggleActive(u)}>
              {u.active ? '🔒' : '✅'}
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => deleteUser(u)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}
