import { useState, useEffect } from 'react';
import api from './api';

export default function ClearedBills() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/orders/completed').then(res => setOrders(res.data));
  }, []);

  const printReceipt = (o) => {
    const win = window.open('', '_blank');
    const itemRows = o.items.map(i =>
      `<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px"><span>${i.product_name} x${i.quantity}</span><span>KSh ${i.subtotal}</span></div>`
    ).join('');
    win.document.write(`
      <html><head><title>Receipt ${o.order_number}</title>
      <style>
        body { font-family: monospace; width: 300px; margin: 0 auto; padding: 16px; font-size: 13px; }
        h2 { text-align: center; margin: 0; font-size: 16px; }
        p { text-align: center; margin: 2px 0; font-size: 12px; }
        .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .bold { font-weight: bold; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>Triple Two Loresho</h2>
      <p>📍 Loresho, Nairobi</p>
      <div class="divider"></div>
      <div class="meta"><span>🔖 ${o.order_number}</span><span>🪑 ${o.table_name}</span></div>
      <div class="meta"><span>👤 ${o.waiter_name}</span><span>📅 ${new Date(o.created_at).toLocaleString()}</span></div>
      <div class="divider"></div>
      ${itemRows}
      <div class="divider"></div>
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px"><span>TOTAL</span><span>KSh ${o.total}</span></div>
      <div class="divider"></div>
      <p>✅ PAID</p>
      <button onclick="window.print()" style="width:100%;padding:8px;margin-top:12px;cursor:pointer">🖨️ Print</button>
      </body></html>
    `);
    win.document.close(); win.focus(); win.print();
  };

  return (
    <div>
      <div className="section-title">✅ Cleared Bills</div>
      {orders.length === 0 && <p className="text-muted">No completed orders yet.</p>}
      {orders.map(o => (
        <div key={o.id} className="cleared-card">
          <div className="cleared-header">
            <div className="flex gap-8" style={{ alignItems:'center' }}>
              <span className="text-accent text-bold">{o.order_number}</span>
              <span className="text-green text-sm">✅ Paid</span>
            </div>
            <span className="text-muted text-sm">{new Date(o.created_at).toLocaleString()}</span>
          </div>
          <div className="cleared-meta">
            <span>🪑 {o.table_name}</span>
            <span>👤 {o.waiter_name}</span>
            <span className="text-accent text-bold">KSh {o.total}</span>
          </div>
          <div className="cleared-actions">
            <button className="btn btn-sm" style={{ background:'var(--card)', color:'white', border:'1px solid var(--accent)' }}
              onClick={() => setSelected(selected?.id === o.id ? null : o)}>
              {selected?.id === o.id ? '▲ Hide' : '▼ Items'}
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => printReceipt(o)}>🖨️ Reprint</button>
          </div>
          {selected?.id === o.id && (
            <div style={{ marginTop:'10px', borderTop:'1px solid var(--card)', paddingTop:'10px' }}>
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
