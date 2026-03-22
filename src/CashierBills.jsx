import { useState, useEffect } from 'react';
import api from './api';

export default function CashierBills({ user, onLogout, onSwitchToPOS }) {
  const [submitted, setSubmitted] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [tab, setTab] = useState('submitted');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        api.get('/orders/submitted'),
        api.get('/orders/confirmed')
      ]);
      setSubmitted(s.data);
      setConfirmed(c.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const confirm = async (order) => {
    try {
      await api.post(`/orders/${order.id}/confirm`);
      setMessage(`✅ ${order.table_name} confirmed!`);
      fetchAll();
    } catch { setMessage('❌ Failed to confirm'); }
  };

  const reject = async () => {
    try {
      await api.post(`/orders/${rejectModal.id}/reject`, { note: rejectNote || 'Payment rejected by cashier' });
      setMessage(`❌ ${rejectModal.table_name} sent back to waiter`);
      setRejectModal(null); setRejectNote('');
      fetchAll();
    } catch { setMessage('❌ Failed to reject'); }
  };

  const methodIcon = (m) => m === 'mpesa' ? '📱' : m === 'card' ? '💳' : m === 'billout' ? '📋' : m === 'split' ? '🔀' : '💵';
  const fmtTime = (iso) => { if (!iso) return ''; return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true }); };

  return (
    <div className="page">
      <div className="header">
        <h2>💰 Cashier Bills</h2>
        <div className="header-right">
          {user && <span className="header-user">👤 {user.name}</span>}
          {onSwitchToPOS && <button className="btn btn-success btn-sm" onClick={onSwitchToPOS}>🛒 POS</button>}
          <button className="btn btn-sm" style={{ background: 'var(--card)', color: 'white' }} onClick={fetchAll}>🔄</button>
          {onLogout && <button className="btn btn-primary btn-sm" onClick={onLogout}>Logout</button>}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'submitted' ? 'active' : 'inactive'}`} onClick={() => setTab('submitted')}>
          📥 Submitted {submitted.length > 0 ? `(${submitted.length})` : ''}
        </button>
        <button className={`tab-btn ${tab === 'confirmed' ? 'active' : 'inactive'}`} onClick={() => setTab('confirmed')}>
          ✅ Confirmed {confirmed.length > 0 ? `(${confirmed.length})` : ''}
        </button>
      </div>

      {message && <div className={`message ${message.startsWith('❌') ? 'message-error' : 'message-success'}`}>{message}</div>}

      {loading && <p className="text-muted">Loading...</p>}

      {tab === 'submitted' && (
        <div>
          {submitted.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '40px' }}>📭</div>
            <div className="text-muted">No submitted bills yet</div>
          </div>}
          {submitted.map(o => (
            <div key={o.id} className="cleared-card" style={{ border: '1px solid var(--accent)' }}>
              <div className="cleared-header">
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                  <span className="text-accent text-bold">{o.order_number}</span>
                  <span className="text-bold">{o.table_name}</span>
                  <span className="text-muted text-sm">👤 {o.waiter_name}</span>
                </div>
                <span className="text-accent text-bold">KSh {o.total}</span>
              </div>

              <div className="text-sm text-muted mb-8">🕐 Submitted: {fmtTime(o.submitted_at)}</div>

              {/* Items */}
              <div style={{ marginBottom: '8px' }}>
                {o.items.map((item, i) => (
                  <div key={i} className="flex-between text-sm mb-8">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>KSh {item.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* Payment details */}
              <div style={{ background: 'var(--card)', borderRadius: '8px', padding: '8px', marginBottom: '10px' }}>
                <div className="text-sm text-bold mb-8">💳 Payment Details</div>
                {o.payment_details && o.payment_details.length > 0 ? (
                  o.payment_details.map((s, i) => (
                    <div key={i} className="flex-between text-sm mb-8">
                      <span>{methodIcon(s.method)} {s.method.charAt(0).toUpperCase() + s.method.slice(1)} {s.ref ? `(${s.ref})` : ''}</span>
                      <span className="text-bold">KSh {s.amount}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">{methodIcon(o.payment_method)} {o.payment_method}</div>
                )}
              </div>

              <div className="flex gap-8">
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => confirm(o)}>✅ Confirm</button>
                <button className="btn" style={{ flex: 1, background: '#e94560', color: 'white' }} onClick={() => { setRejectModal(o); setRejectNote(''); }}>❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'confirmed' && (
        <div>
          {confirmed.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '40px' }}>📭</div>
            <div className="text-muted">No confirmed bills yet</div>
          </div>}
          {confirmed.map(o => (
            <div key={o.id} className="cleared-card">
              <div className="cleared-header">
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                  <span className="text-accent text-bold">{o.order_number}</span>
                  <span className="text-bold">{o.table_name}</span>
                  <span className="text-muted text-sm">👤 {o.waiter_name}</span>
                </div>
                <span className="text-accent text-bold">KSh {o.total}</span>
              </div>
              <div className="text-sm text-muted">✅ Confirmed by {o.confirmed_by} at {fmtTime(o.confirmed_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">❌ Reject Payment</div>
            <p className="text-muted text-sm mb-8">{rejectModal.table_name} — {rejectModal.order_number}</p>
            <p className="text-sm mb-8">This will send the bill back to the waiter.</p>
            <input className="input" placeholder="Reason (optional)" value={rejectNote}
              onChange={e => setRejectNote(e.target.value)} />
            <div className="modal-actions">
              <button className="btn" style={{ background: '#e94560', color: 'white' }} onClick={reject}>❌ Reject</button>
              <button className="btn btn-muted" onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
