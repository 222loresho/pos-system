import { useState, useEffect } from 'react';
import api from './api';

export default function DailyReport() {
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('summary');
  const [expanded, setExpanded] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily?date=${date}`);
      setReport(res.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [date]);

  const methodIcon = (m) => m === 'mpesa' ? '📱' : m === 'card' ? '💳' : '💵';
  const methodLabel = (m) => m === 'mpesa' ? 'Mpesa' : m === 'card' ? 'Card' : 'Cash';
  const fmtTime = (iso) => { const d = new Date(iso); d.setHours(d.getHours() + 3); return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true }); };

  const printReport = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Daily Report - ${date}</title>
      <style>
        body{font-family:monospace;padding:20px;max-width:800px;margin:0 auto;font-size:13px}
        h1{text-align:center;font-size:18px}
        h2{font-size:14px;margin-top:16px;border-bottom:1px dashed #000;padding-bottom:4px}
        .row{display:flex;justify-content:space-between;margin-bottom:4px}
        .bold{font-weight:bold}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{text-align:left;padding:4px 8px;border-bottom:1px solid #eee;font-size:12px}
        th{background:#f5f5f5;font-weight:bold}
        @media print{button{display:none}}
      </style></head><body>
      <h1>Javari</h1>
      <p style="text-align:center">Daily Sales Report — ${date}</p>
      <h2>Summary</h2>
      <div class="row"><span>Total Revenue:</span><span class="bold">KSh ${report.total_revenue}</span></div>
      <div class="row"><span>Total Transactions:</span><span class="bold">${report.total_transactions}</span></div>
      <h2>By Payment Method</h2>
      ${Object.entries(report.by_payment_method).map(([m, v]) =>
        `<div class="row"><span>${methodLabel(m)}:</span><span>KSh ${v.total} (${v.count} transactions)</span></div>`
      ).join('')}
      <h2>All Items Sold</h2>
      <table>
        <tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
        ${(report.all_items || []).map((p, i) =>
          `<tr><td>${i + 1}</td><td>${p.product_name}</td><td>${p.quantity}</td><td>KSh ${p.revenue}</td></tr>`
        ).join('')}
        <tr style="font-weight:bold"><td></td><td>TOTAL</td><td>${(report.all_items || []).reduce((a, p) => a + p.quantity, 0)}</td><td>KSh ${report.total_revenue}</td></tr>
      </table>
      <h2>All Transactions</h2>
      <table>
        <tr><th>#</th><th>Cashier</th><th>Payment</th><th>Total</th><th>Time</th></tr>
        ${report.sales.map(s =>
          `<tr><td>${s.id}</td><td>${s.cashier_name}</td><td>${methodLabel(s.payment_method)}</td><td>KSh ${s.total}</td><td>${fmtTime(s.created_at)}</td></tr>`
        ).join('')}
      </table>
      <button onclick="window.print()" style="margin-top:16px;padding:8px 16px;cursor:pointer">🖨️ Print</button>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  const views = ['summary', 'items', 'transactions'];

  return (
    <div>
      <div className="flex-between mb-8">
        <div className="section-title" style={{ margin: 0 }}>📊 Daily Report</div>
        <div className="flex gap-8" style={{ alignItems: 'center' }}>
          <input type="date" className="input" style={{ margin: 0, width: 'auto' }}
            value={date} onChange={e => setDate(e.target.value)} />
          {report && <button className="btn btn-sm" style={{ background: 'var(--card)', color: 'white' }} onClick={printReport}>🖨️</button>}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '12px' }}>
        {views.map(v => (
          <button key={v} className={`tab-btn ${view === v ? 'active' : 'inactive'}`}
            onClick={() => setView(v)}>
            {v === 'summary' ? '📋 Summary' : v === 'items' ? '📦 Items Sold' : '🧾 Transactions'}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted">Loading...</p>}

      {report && view === 'summary' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            <div className="card card-dark" style={{ textAlign: 'center' }}>
              <div className="text-muted text-sm">Total Revenue</div>
              <div className="text-accent text-bold" style={{ fontSize: '20px', margin: '4px 0' }}>KSh {report.total_revenue}</div>
            </div>
            <div className="card card-dark" style={{ textAlign: 'center' }}>
              <div className="text-muted text-sm">Transactions</div>
              <div className="text-bold" style={{ fontSize: '20px', margin: '4px 0' }}>{report.total_transactions}</div>
            </div>
            <div className="card card-dark" style={{ textAlign: 'center' }}>
              <div className="text-muted text-sm">Items Sold</div>
              <div className="text-bold" style={{ fontSize: '20px', margin: '4px 0' }}>{(report.all_items || []).reduce((a, p) => a + p.quantity, 0)}</div>
            </div>
            {Object.entries(report.by_payment_method).map(([m, v]) => (
              <div key={m} className="card card-dark" style={{ textAlign: 'center' }}>
                <div className="text-muted text-sm">{methodIcon(m)} {methodLabel(m)}</div>
                <div className="text-bold" style={{ fontSize: '16px', margin: '4px 0' }}>KSh {v.total}</div>
                <div className="text-xs text-muted">{v.count} transactions</div>
              </div>
            ))}
          </div>

          {report.top_products.length > 0 && (
            <div className="card">
              <div className="section-title">🏆 Top 10 Products</div>
              {report.top_products.map((p, i) => (
                <div key={i} className="flex-between" style={{ marginBottom: '8px', alignItems: 'center' }}>
                  <div className="flex gap-8" style={{ alignItems: 'center' }}>
                    <span style={{ background: i === 0 ? '#e94560' : i === 1 ? '#f0a500' : i === 2 ? '#4caf50' : 'var(--card)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{i + 1}</span>
                    <span className="text-sm">{p.product_name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-accent text-bold text-sm">KSh {p.revenue}</div>
                    <div className="text-xs text-muted">{p.quantity} sold</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {report && view === 'items' && (
        <div className="card">
          <div className="flex-between mb-8">
            <div className="section-title" style={{ margin: 0 }}>📦 All Items Sold</div>
            <div className="text-muted text-sm">{(report.all_items || []).length} products | {(report.all_items || []).reduce((a, p) => a + p.quantity, 0)} units</div>
          </div>
          {(report.all_items || []).length === 0 && <p className="text-muted">No items sold on this date.</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card)' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '11px', color: 'var(--muted)' }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '11px', color: 'var(--muted)' }}>Product</th>
                <th style={{ textAlign: 'center', padding: '6px 4px', fontSize: '11px', color: 'var(--muted)' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '11px', color: 'var(--muted)' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(report.all_items || []).map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--card)' }}>
                  <td style={{ padding: '8px 4px', fontSize: '12px', color: 'var(--muted)' }}>{i + 1}</td>
                  <td style={{ padding: '8px 4px', fontSize: '13px' }}>{p.product_name}</td>
                  <td style={{ padding: '8px 4px', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>{p.quantity}</td>
                  <td style={{ padding: '8px 4px', fontSize: '13px', textAlign: 'right', color: 'var(--accent)' }}>KSh {p.revenue}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--accent)' }}>
                <td colSpan="2" style={{ padding: '8px 4px', fontWeight: 'bold', fontSize: '13px' }}>TOTAL</td>
                <td style={{ padding: '8px 4px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>{(report.all_items || []).reduce((a, p) => a + p.quantity, 0)}</td>
                <td style={{ padding: '8px 4px', fontWeight: 'bold', fontSize: '13px', textAlign: 'right', color: 'var(--accent)' }}>KSh {report.total_revenue}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {report && view === 'transactions' && (
        <div>
          {report.sales.length === 0 && <p className="text-muted">No transactions on this date.</p>}
          {report.sales.map(s => (
            <div key={s.id} className="cleared-card">
              <div className="cleared-header">
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                  <span className="text-accent text-bold text-sm">#{s.id}</span>
                  <span className="text-sm">{s.cashier_name}</span>
                  <span className="text-sm">{methodIcon(s.payment_method)} {methodLabel(s.payment_method)}</span>
                </div>
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                  <span className="text-accent text-bold">KSh {s.total}</span>
                  <span className="text-muted text-xs">{fmtTime(s.created_at)}</span>
                </div>
              </div>
              <button className="btn btn-sm" style={{ background: 'var(--card)', color: 'white', border: '1px solid var(--accent)' }}
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                {expanded === s.id ? '▲ Hide' : '▼ Items'}
              </button>
              {expanded === s.id && (
                <div style={{ marginTop: '10px', borderTop: '1px solid var(--card)', paddingTop: '10px' }}>
                  {s.items.map((i, idx) => (
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
      )}

      {!loading && !report && <p className="text-muted">No data found for this date.</p>}
    </div>
  );
}
