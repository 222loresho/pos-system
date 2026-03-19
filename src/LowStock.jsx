import { useState, useEffect } from 'react';
import api from './api';

export default function LowStock({ onCount }) {
  const [items, setItems] = useState([]);
  const [threshold, setThreshold] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/low-stock?threshold=${threshold}`);
      setItems(res.data);
      if (onCount) onCount(res.data.length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [threshold]);

  const stockColor = (stock) => {
    if (stock === 0) return '#e94560';
    if (stock <= 5) return '#f0a500';
    return '#4caf50';
  };

  return (
    <div>
      <div className="flex-between mb-8">
        <div className="section-title" style={{ margin: 0 }}>⚠️ Low Stock Alerts</div>
        <div className="flex gap-8" style={{ alignItems: 'center' }}>
          <span className="text-muted text-sm">Alert below:</span>
          <select className="input" style={{ margin: 0, width: 'auto', padding: '4px 8px' }}
            value={threshold} onChange={e => setThreshold(Number(e.target.value))}>
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} units</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="text-muted">Loading...</p>}

      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
          <div className="text-bold">All products are well stocked!</div>
          <div className="text-muted text-sm">No items below {threshold} units</div>
        </div>
      )}

      {items.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', background: 'rgba(233,69,96,0.1)', border: '1px solid #e94560' }}>
          <div className="text-bold" style={{ color: '#e94560', marginBottom: '4px' }}>
            ⚠️ {items.length} product{items.length > 1 ? 's' : ''} running low!
          </div>
          <div className="text-muted text-sm">Restock soon to avoid running out</div>
        </div>
      )}

      {items.map(p => (
        <div key={p.id} className="admin-item">
          <div>
            <div className="admin-item-info">{p.name}</div>
            <div className="admin-item-sub">KSh {p.price}</div>
          </div>
          <div className="flex gap-8" style={{ alignItems: 'center' }}>
            <div style={{
              background: stockColor(p.stock),
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '14px',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {p.stock === 0 ? '❌ OUT' : `${p.stock} left`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
