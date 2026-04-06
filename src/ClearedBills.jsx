import { useState, useEffect } from 'react';
import api from './api';

export default function ClearedBills() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { api.get('/orders/completed').then(res => setOrders(res.data)).catch(() => {}); }, []);

  const printBill = (order) => import('./print').then(m => m.printBill(order));

  return (
    <div style={{padding:'14px'}}>
      <div className="section-title">✅ Cleared Bills</div>
      {orders.length === 0 && <p className="text-muted">No cleared bills yet</p>}
      {orders.map(o => (
        <div key={o.id} className="cleared-card">
          <div className="cleared-header">
            <div className="flex gap-8" style={{alignItems:'center'}}>
              <span className="text-accent text-bold">{o.order_number}</span>
              <span className="text-bold">{o.table_name}</span>
              <span className="text-muted text-sm">👤 {o.waiter_name}</span>
            </div>
            <span className="text-accent text-bold">KSh {o.total}</span>
          </div>
          <div className="text-muted text-sm mb-8">{new Date(o.created_at).toLocaleString()}</div>
          <div className="flex gap-8">
            <button className="btn btn-sm" style={{background:'var(--card)',color:'white'}} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              {expanded === o.id ? '▲ Hide' : '▼ Items'}
            </button>
            <button className="btn btn-sm" style={{background:'var(--card)',color:'white'}} onClick={() => printBill(o)}>🖨️ Reprint</button>
          </div>
          {expanded === o.id && (
            <div style={{marginTop:'10px',borderTop:'1px solid var(--card)',paddingTop:'10px'}}>
              {o.items.map((i, idx) => (
                <div key={idx} className="flex-between text-sm mb-8">
                  <span>{i.product_name} x{i.quantity}</span>
                  <span>KSh {i.subtotal}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
