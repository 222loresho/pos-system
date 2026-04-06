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
    } catch { setReport(null); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [date]);

  const methodIcon = (m) => m === 'mpesa' ? '📱' : m === 'card' ? '💳' : '💵';
  const methodLabel = (m) => m === 'mpesa' ? 'Mpesa' : m === 'card' ? 'Card' : 'Cash';
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div style={{padding:'14px'}}>
      <div className="flex-between mb-8">
        <div className="section-title" style={{margin:0}}>📊 Daily Report</div>
        <input type="date" className="input" style={{margin:0,width:'auto'}} value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="tabs" style={{marginBottom:'12px'}}>
        {['summary','items','transactions'].map(v => (
          <button key={v} className={`tab-btn ${view === v ? 'active' : 'inactive'}`} onClick={() => setView(v)}>
            {v === 'summary' ? '📋 Summary' : v === 'items' ? '📦 Items' : '🧾 Transactions'}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted">Loading...</p>}

      {report && view === 'summary' && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'10px',marginBottom:'16px'}}>
            <div className="card card-dark" style={{textAlign:'center'}}>
              <div className="text-muted text-sm">Revenue</div>
              <div className="text-accent text-bold" style={{fontSize:'20px'}}> KSh {report.total_revenue}</div>
            </div>
            <div className="card card-dark" style={{textAlign:'center'}}>
              <div className="text-muted text-sm">Transactions</div>
              <div className="text-bold" style={{fontSize:'20px'}}>{report.total_transactions}</div>
            </div>
            {Object.entries(report.by_payment_method || {}).map(([m, v]) => (
              <div key={m} className="card card-dark" style={{textAlign:'center'}}>
                <div className="text-muted text-sm">{methodIcon(m)} {methodLabel(m)}</div>
                <div className="text-bold" style={{fontSize:'16px'}}>KSh {v.total}</div>
                <div className="text-xs text-muted">{v.count} transactions</div>
              </div>
            ))}
          </div>
          {(report.top_products || []).length > 0 && (
            <div className="card">
              <div className="section-title">🏆 Top Products</div>
              {report.top_products.map((p, i) => (
                <div key={i} className="flex-between mb-8" style={{alignItems:'center'}}>
                  <div className="flex gap-8" style={{alignItems:'center'}}>
                    <span style={{background:i===0?'var(--red)':i===1?'#f0a500':'var(--accent)',color:'white',borderRadius:'50%',width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'bold'}}>{i+1}</span>
                    <span className="text-sm">{p.product_name}</span>
                  </div>
                  <div style={{textAlign:'right'}}>
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
            <div className="section-title" style={{margin:0}}>📦 Items Sold</div>
            <div className="text-muted text-sm">{(report.all_items||[]).reduce((a,p) => a+p.quantity,0)} units</div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--card)'}}>
                <th style={{textAlign:'left',padding:'6px 4px',fontSize:'11px',color:'var(--muted)'}}>#</th>
                <th style={{textAlign:'left',padding:'6px 4px',fontSize:'11px',color:'var(--muted)'}}>Product</th>
                <th style={{textAlign:'center',padding:'6px 4px',fontSize:'11px',color:'var(--muted)'}}>Qty</th>
                <th style={{textAlign:'right',padding:'6px 4px',fontSize:'11px',color:'var(--muted)'}}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(report.all_items||[]).map((p, i) => (
                <tr key={i} style={{borderBottom:'1px solid var(--card)'}}>
                  <td style={{padding:'8px 4px',fontSize:'12px',color:'var(--muted)'}}>{i+1}</td>
                  <td style={{padding:'8px 4px',fontSize:'13px'}}>{p.product_name}</td>
                  <td style={{padding:'8px 4px',fontSize:'13px',textAlign:'center',fontWeight:'bold'}}>{p.quantity}</td>
                  <td style={{padding:'8px 4px',fontSize:'13px',textAlign:'right',color:'var(--accent)'}}>KSh {p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report && view === 'transactions' && (
        <div>
          {(report.sales||[]).map(s => (
            <div key={s.id} className="cleared-card">
              <div className="cleared-header">
                <div className="flex gap-8" style={{alignItems:'center'}}>
                  <span className="text-accent text-bold text-sm">#{s.id}</span>
                  <span className="text-sm">{s.cashier_name}</span>
                  <span className="text-sm">{methodIcon(s.payment_method)} {methodLabel(s.payment_method)}</span>
                </div>
                <div className="flex gap-8" style={{alignItems:'center'}}>
                  <span className="text-accent text-bold">KSh {s.total}</span>
                  <span className="text-muted text-xs">{fmtTime(s.created_at)}</span>
                </div>
              </div>
              <button className="btn btn-sm" style={{background:'var(--card)',color:'white',border:'1px solid var(--accent)'}} onClick={() => setExpanded(expanded===s.id?null:s.id)}>
                {expanded===s.id ? '▲ Hide' : '▼ Items'}
              </button>
              {expanded === s.id && (
                <div style={{marginTop:'10px',borderTop:'1px solid var(--card)',paddingTop:'10px'}}>
                  {s.items.map((i,idx) => (
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

      {!loading && !report && <p className="text-muted">No data for this date.</p>}
    </div>
  );
}
