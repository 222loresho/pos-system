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
      `<div class="row"><span>${i.product_name} x${i.quantity}</span><span>KSh ${i.subtotal}</span></div>`
    ).join('');
    win.document.write(`
      <html><head><title>Receipt ${o.order_number}</title>
      <style>
        body { font-family: monospace; width: 300px; margin: 0 auto; padding: 16px; font-size: 13px; }
        h2 { text-align: center; margin: 0; font-size: 16px; }
        p { text-align: center; margin: 2px 0; font-size: 12px; }
        .left { text-align: left !important; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .bold { font-weight: bold; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>Triple Two Loresho</h2>
      <p>📍 Loresho, Nairobi</p>
      <div class="divider"></div>
      <p class="left">Order: ${o.order_number}</p>
      <p class="left">🪑 ${o.table_name}</p>
      <p class="left">👤 Waiter: ${o.waiter_name}</p>
      <p class="left">📅 ${new Date(o.created_at).toLocaleString()}</p>
      <div class="divider"></div>
      ${itemRows}
      <div class="divider"></div>
      <div class="row bold"><span>TOTAL</span><span>KSh ${o.total}</span></div>
      <div class="divider"></div>
      <p>✅ PAID</p>
      <button onclick="window.print()" style="width:100%;padding:8px;margin-top:12px;cursor:pointer">🖨️ Print</button>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div style={{ background:'#1a1a2e', minHeight:'100vh', color:'white', padding:'16px' }}>
      <h2 style={{ color:'#e94560', marginTop:0 }}>✅ Cleared Bills</h2>
      {orders.length === 0 && <p style={{ color:'#888' }}>No completed orders yet.</p>}
      <div style={{ display:'grid', gap:'12px' }}>
        {orders.map(o => (
          <div key={o.id} style={{ background:'#16213e', borderRadius:'10px', padding:'14px', border:'1px solid #0f3460' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
              <div>
                <span style={{ color:'#e94560', fontWeight:'bold', fontSize:'16px' }}>{o.order_number}</span>
                <span style={{ marginLeft:'10px', color:'#4caf50', fontSize:'13px' }}>✅ Paid</span>
              </div>
              <div style={{ fontSize:'13px', color:'#888' }}>{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div style={{ marginTop:'8px', fontSize:'14px', display:'flex', gap:'16px', flexWrap:'wrap' }}>
              <span>🪑 {o.table_name}</span>
              <span>👤 {o.waiter_name}</span>
              <span style={{ color:'#e94560', fontWeight:'bold' }}>KSh {o.total}</span>
            </div>
            <div style={{ marginTop:'8px', display:'flex', gap:'8px' }}>
              <button onClick={() => setSelected(selected?.id === o.id ? null : o)}
                style={{ padding:'6px 12px', background:'#0f3460', color:'white', border:'1px solid #e94560', borderRadius:'6px', cursor:'pointer', fontSize:'12px' }}>
                {selected?.id === o.id ? '▲ Hide' : '▼ Items'}
              </button>
              <button onClick={() => printReceipt(o)}
                style={{ padding:'6px 12px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px' }}>
                🖨️ Reprint
              </button>
            </div>
            {selected?.id === o.id && (
              <div style={{ marginTop:'10px', borderTop:'1px solid #0f3460', paddingTop:'10px' }}>
                {o.items.map((i, idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px' }}>
                    <span>{i.product_name} x{i.quantity}</span>
                    <span>KSh {i.subtotal}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
