import { useState, useEffect } from 'react';
import api from './api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'cashier', pin: '' });

  const fetchUsers = () => api.get('/users/').then(res => setUsers(res.data));
  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => { setForm({ name: '', username: '', password: '', role: 'cashier', pin: '' }); setEditUser(null); setShowForm(false); };

  const saveUser = async () => {
    if (!form.name || !form.username) return setMessage('❌ Name and username required!');
    if (!editUser && !form.password) return setMessage('❌ Password required!');
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
    await api.put(`/users/${user.id}`, { active: !user.active });
    fetchUsers();
    setMessage(`✅ ${user.name} ${!user.active ? 'activated' : 'deactivated'}!`);
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      setMessage('✅ User deleted!');
      fetchUsers();
    } catch (e) {
      setMessage('❌ ' + (e.response?.data?.error || 'Failed'));
    }
  };

  const startEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, username: user.username, password: '', role: user.role, pin: '' });
    setShowForm(true);
  };

  const roleColor = (role) => role === 'admin' ? '#e94560' : '#4caf50';

  return (
    <div>
      <div className="flex-between mb-8">
        <div className="section-title" style={{ margin: 0 }}>👥 User Management</div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {message && <div className={`message ${message.startsWith('❌') ? 'message-error' : 'message-success'}`}>{message}</div>}

      {showForm && (
        <div className="card" style={{ border: '1px solid var(--accent)', marginBottom: '16px' }}>
          <div className="section-title">{editUser ? '✏️ Edit User' : '➕ New User'}</div>
          <input className="input" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editUser} />
          <input className="input" type="password" placeholder={editUser ? 'New password (leave blank to keep)' : 'Password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input className="input" type="number" placeholder="4-digit PIN (default: 1234)" maxLength={4} value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value.slice(0,4) })} />
          <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
            <option value="waiter">Waiter</option>
          </select>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={saveUser}>{editUser ? '💾 Save Changes' : '✅ Create User'}</button>
            <button className="btn btn-muted" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {users.length === 0 && <p className="text-muted">No users found</p>}
      {users.map(u => (
        <div key={u.id} className="admin-item" style={{ opacity: u.active ? 1 : 0.5 }}>
          <div>
            <div className="flex gap-8" style={{ alignItems: 'center', marginBottom: '4px' }}>
              <span className="admin-item-info">{u.name}</span>
              <span style={{ background: roleColor(u.role), color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                {u.role.toUpperCase()}
              </span>
              {!u.active && <span style={{ background: '#555', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>INACTIVE</span>}
            </div>
            <div className="admin-item-sub">@{u.username}</div>
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
