import { useState, useEffect } from 'react';
import api from './api';

export default function LowStock({ onCount }) {
  const [items, setItems] = useState([]);
  const [threshold, setThreshold] = useState(10);

  const fetchLow = async () => {
    try {
      const res = await api.get(`/products/low-stock?threshold=${threshold}`);
      setItems(res.data);
      if (onCount) onCount(res.data.length);
    } catch { setItems([]); }
  };

  useEffect(() => { fetchLow(); }, [threshold]);

  const stockColor = (stock) => stock === 0 ? 'var(--red)' : stock <= 5 ? '#f0a500' : 'var(--accent)';

  return (
    <div style={{padding:'14px'}}>
      <div className="flex-between mb-8">
        <div className="section-title" style={{margin:0}}>⚠️ Low Stock</div>
        <select className="input" style={{margin:0,width:'auto'}} value={threshold} onChange={e => setThreshold(Number(e.target.value))}>
          {[5,10,15,20].map(n => <option key={n} value={n}>Below {n}</option>)}
        </select>
      </div>
      {items.length === 0 && <div className="card" style={{textAlign:'center',padding:'32px'}}><div style={{fontSize:'40px'}}>✅</div><div className="text-muted">All products well stocked</div></div>}
      {items.length > 0 && <div className="card" style={{background:'rgba(220,38,38,0.1)',border:'1px solid var(--red)',marginBottom:'16px'}}><div className="text-bold" style={{color:'var(--red)'}}>⚠️ {items.length} product(s) running low!</div></div>}
      {items.map(p => (
        <div key={p.id} className="admin-item">
          <div>
            <div className="admin-item-info">{p.name}</div>
            <div className="admin-item-sub">KSh {p.price}</div>
          </div>
          <div style={{background:stockColor(p.stock),color:'white',padding:'4px 12px',borderRadius:'20px',fontWeight:'bold',fontSize:'14px'}}>
            {p.stock === 0 ? 'OUT' : `${p.stock} left`}
          </div>
        </div>
      ))}
    </div>
  );
}
