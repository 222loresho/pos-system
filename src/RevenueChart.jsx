import { useState, useEffect } from 'react';
import api from './api';

export default function RevenueChart() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/revenue?period=${period}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [period]);

  const fmtLabel = (label) => {
    if (period === 'weekly' || period === 'monthly') {
      const d = new Date(label);
      return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    }
    if (period === 'yearly') {
      const [y, m] = label.split('-');
      return new Date(y, m - 1).toLocaleDateString('en-KE', { month: 'short' });
    }
    return label;
  };

  const renderChart = () => {
    if (!data || !data.data.length) return null;
    const maxVal = Math.max(...data.data.map(d => d.revenue), 1);
    const chartH = 180;
    const gap = period === 'daily' ? 28 : period === 'monthly' ? 22 : 52;
    const barW = period === 'daily' ? 18 : period === 'monthly' ? 14 : 36;
    const chartW = data.data.length * gap;

    return (
      <div style={{overflowX:'auto',paddingBottom:'8px'}}>
        <svg width={chartW + 40} height={chartH + 60} style={{display:'block'}}>
          {[0,0.25,0.5,0.75,1].map((pct, i) => (
            <g key={i}>
              <line x1={30} y1={chartH - pct*chartH + 10} x2={chartW+30} y2={chartH - pct*chartH + 10} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x={0} y={chartH - pct*chartH + 14} fill="#888" fontSize="9">{Math.round(maxVal*pct/1000)}k</text>
            </g>
          ))}
          {data.data.map((d, i) => {
            const x = 30 + i*gap + (gap-barW)/2;
            const barH = Math.max((d.revenue/maxVal)*chartH, d.revenue > 0 ? 4 : 0);
            const y = chartH - barH + 10;
            const isPeak = data.peak && d.label === data.peak.label;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx="3" fill={isPeak ? 'var(--red)' : d.revenue > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)'} />
                {d.revenue > 0 && <text x={x+barW/2} y={y-4} fill="#ccc" fontSize="8" textAnchor="middle">{d.revenue >= 1000 ? `${(d.revenue/1000).toFixed(1)}k` : d.revenue}</text>}
                <text x={x+barW/2} y={chartH+24} fill="#888" fontSize="9" textAnchor="middle">{fmtLabel(d.label)}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{padding:'14px'}}>
      <div className="flex-between mb-8">
        <div className="section-title" style={{margin:0}}>📈 Revenue</div>
        <button className="btn btn-sm" style={{background:'var(--card)',color:'white'}} onClick={fetchData}>🔄</button>
      </div>
      <div className="tabs" style={{marginBottom:'12px'}}>
        {['daily','weekly','monthly','yearly'].map(p => (
          <button key={p} className={`tab-btn ${period===p?'active':'inactive'}`} onClick={() => setPeriod(p)}>
            {p==='daily'?'Today':p==='weekly'?'7 Days':p==='monthly'?'30 Days':'12 Months'}
          </button>
        ))}
      </div>
      {loading && <p className="text-muted">Loading...</p>}
      {data && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'10px',marginBottom:'16px'}}>
            <div className="card card-dark" style={{textAlign:'center'}}>
              <div className="text-muted text-sm">Total</div>
              <div className="text-accent text-bold" style={{fontSize:'18px'}}>KSh {data.total.toLocaleString()}</div>
            </div>
            {data.peak && data.peak.revenue > 0 && (
              <div className="card card-dark" style={{textAlign:'center'}}>
                <div className="text-muted text-sm">Peak</div>
                <div className="text-bold" style={{fontSize:'14px'}}>{fmtLabel(data.peak.label)}</div>
                <div className="text-accent text-sm">KSh {data.peak.revenue.toLocaleString()}</div>
              </div>
            )}
          </div>
          <div className="card card-dark">
            {data.data.every(d => d.revenue === 0) ? <p className="text-muted" style={{textAlign:'center',padding:'32px 0'}}>No data for this period</p> : renderChart()}
          </div>
        </>
      )}
    </div>
  );
}
