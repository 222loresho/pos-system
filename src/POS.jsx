import { useState, useEffect, useRef } from 'react';
import { printBill, printReceipt as doPrintReceipt } from './print';
import api from './api';

const toEAT = (iso) => {
  const d = new Date(iso);
  d.setHours(d.getHours() + 3);
  return d;
};


export default function POS({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [splits, setSplits] = useState([{method:'cash',amount:'',ref:''}]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const receiptRef = useRef();
  const [view, setView] = useState('sales');
  const [showTableEdit, setShowTableEdit] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState('all');

  const fetchProducts = () => api.get('/products/').then(res => setProducts(res.data));
  const fetchCategories = () => api.get('/categories/').then(res => setCategories(res.data));
  const fetchOrders = () => api.get('/orders/').then(res => setPendingOrders(res.data));

  useEffect(() => { fetchProducts(); fetchCategories(); fetchOrders(); }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price } : i));
    } else {
      setCart([...cart, { product_id: product.id, product_name: product.name, price: product.price, quantity: 1, subtotal: product.price }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.product_id !== id));

  const updateQty = (id, delta) => {
    setCart(cart.map(i => {
      if (i.product_id !== id) return i;
      const q = i.quantity + delta;
      if (q <= 0) return null;
      return { ...i, quantity: q, subtotal: q * i.price };
    }).filter(Boolean));
  };

  const total = cart.reduce((sum, i) => sum + i.subtotal, 0);

  const resetPayment = () => { setSplits([{method:'cash',amount:'',ref:''}]); };

  const getNextTableNumber = () => {
    if (pendingOrders.length === 0) return 1;
    const nums = pendingOrders.map(o => { const m = o.table_name.match(/Table (\d+)/); return m ? parseInt(m[1]) : 0; });
    return Math.max(...nums) + 1;
  };

  const loadOrder = (order) => {
    setActiveOrder(order);
    setShowTableEdit(true);
    setCart(order.items.map(i => ({ product_id: i.product_id, product_name: i.product_name, price: i.price, quantity: i.quantity, subtotal: i.subtotal })));
    setMessage(`📋 Editing ${order.table_name}`);
  };

  const clearActiveOrder = () => { setActiveOrder(null); setCart([]); resetPayment(); setMessage(''); setShowTableEdit(false); };

  const saveTable = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    setPinInput(''); setPinError(''); setShowPinModal(true);
  };

  const confirmSaveTable = async () => {
    const tableName = `Table ${getNextTableNumber()}`;
    try {
      await api.post('/orders/', {
        table_name: tableName, waiter_name: user.name,
        items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
        total
      });
      setMessage(`✅ Saved as ${tableName}!`); setCart([]); setActiveOrder(null); fetchOrders(); setShowPinModal(false);
    } catch { setMessage('❌ Failed to save'); }
  };

  const updateTable = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    try {
      await api.put(`/orders/${activeOrder.id}`, {
        items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
        total
      });
      setMessage(`✅ ${activeOrder.table_name} updated!`); setCart([]); setActiveOrder(null); fetchOrders();
    } catch { setMessage('❌ Failed to update'); }
  };

  const validatePayment = (orderTotal) => {
    const totalPaid = splits.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);
    if (totalPaid < orderTotal) return '❌ Total paid (KSh ' + totalPaid + ') is less than total (KSh ' + orderTotal + ')!';
    for (const s of splits) {
      if (!s.amount || parseFloat(s.amount) <= 0) return '❌ Enter amount for all payment methods!';
      if (s.method === 'mpesa' && !s.ref.trim()) return '❌ Enter Mpesa code!';
      if (s.method === 'card' && !s.ref.trim()) return '❌ Enter card auth number!';
    }
    return null;
  };

  const completeOrder = async () => {
    const err = validatePayment(activeOrder.total);
    if (err) return setMessage(err);
    try {
      const totalPaid = splits.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);
      const primaryMethod = splits.length === 1 ? splits[0].method : 'split';
      await api.post(`/orders/${activeOrder.id}/submit`, {
        payment_method: primaryMethod,
        splits: splits
      });
      setMessage('✅ Payment submitted! Waiting for cashier confirmation.');
      resetPayment(); setActiveOrder(null); setShowPayModal(false); setCart([]); setShowTableEdit(false);
      fetchOrders(); fetchProducts();
    } catch { setMessage('❌ Submission failed!'); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    const err = validatePayment(total);
    if (err) return setMessage(err);
    try {
      const totalPaid = splits.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);
      const primaryMethod = splits.length === 1 ? splits[0].method : 'split';
      const res = await api.post('/sales/', {
        items: cart,
        amount_paid: totalPaid,
        payment_method: primaryMethod,
        splits: splits
      });
      setReceipt({ orderNumber: null, tableName: null, waiterName: user.name, items: cart, total, amountPaid: totalPaid, change: res.data.change_due, cashier: user.name, paymentMethod: primaryMethod, splits, date: new Date().toLocaleString() });
      setCart([]); resetPayment(); fetchProducts();
    } catch { setMessage('❌ Sale failed!'); }
  };

  const printBill = (order) => {
    import('./print').then(m => m.printBill(order));
  };

  const printReceipt = () => {
    import('./print').then(m => m.printReceipt(receipt));
  };


  return (
    <div className="page">
      <div className="header">
        <h2>🛒 POS</h2>
        <div className="header-right">
          <span className="header-user">👤 {user.name}</span>
          <button className="btn btn-primary btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div style={{display:"flex",gap:"10px",padding:"10px 16px 0",borderBottom:"1px solid var(--card)",marginBottom:"8px"}}>
        <button onClick={() => setView("sales")} style={{flex:1,padding:"10px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:"bold",fontSize:"14px",background:view==="sales"?"var(--accent)":"var(--card)",color:"white"}}>{"🛒 Sales"}</button>
        <button onClick={() => {setView("tables");fetchOrders();}} style={{flex:1,padding:"10px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:"bold",fontSize:"14px",background:view==="tables"?"var(--accent)":"var(--card)",color:"white"}}>{"🪑 Tables "}{pendingOrders.length > 0 ? "("+pendingOrders.length+")" : ""}</button>
      </div>

      {view === "tables" && pendingOrders.length > 0 && (
        <div className="pending-section">
          <div className="section-title">🕐 Awaiting Payment</div>

          {/* Waiter filter bubbles */}
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',padding:'0 0 12px',overflowX:'auto'}}>
            <button
              onClick={() => setSelectedWaiter('all')}
              style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'bold',fontSize:'12px',background:selectedWaiter==='all'?'var(--accent)':'var(--card)',color:'white',whiteSpace:'nowrap'}}>
              👥 All ({pendingOrders.length})
            </button>
            {[...new Set(pendingOrders.map(o => o.waiter_name))].map(waiter => (
              <button key={waiter}
                onClick={() => setSelectedWaiter(waiter)}
                style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontWeight:'bold',fontSize:'12px',background:selectedWaiter===waiter?'var(--accent)':'var(--card)',color:'white',whiteSpace:'nowrap'}}>
                👤 {waiter} ({pendingOrders.filter(o => o.waiter_name === waiter).length})
              </button>
            ))}
          </div>

          <div className="pending-grid">
            {pendingOrders.filter(o => selectedWaiter === 'all' || o.waiter_name === selectedWaiter).map(o => (
              <div key={o.id} className={`pending-card ${activeOrder?.id === o.id ? 'active' : 'inactive'}`}>
                <div onClick={() => loadOrder(o)} style={{ cursor:'pointer' }}>
                  <div className="flex-between mb-8">
                    <span className="text-bold text-sm" style={{ color: activeOrder?.id === o.id ? 'white' : 'var(--accent)' }}>{o.order_number}</span>
                    <span className="text-bold text-sm" style={{ color: activeOrder?.id === o.id ? 'white' : 'var(--accent)' }}>{o.table_name}</span>
                  </div>
                  <div className="pending-meta">
                    <span>👤 {o.waiter_name}</span>
                    <span>🕐 {toEAT(o.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <div className="pending-meta">
                    <span>{o.items?.length || 0} items</span>
                    <span className="text-bold" style={{ color: activeOrder?.id === o.id ? 'white' : 'var(--accent)' }}>KSh {o.total}</span>
                  </div>
                </div>
                <div className="pending-actions">
                  <button className="pending-btn pending-btn-bill" onClick={e => { e.stopPropagation(); printBill(o); }}>🧾 Bill</button>
                  <button className="pending-btn pending-btn-pay" onClick={e => { e.stopPropagation(); loadOrder(o); setShowPayModal(true); }}>💳 Submit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "sales" && <div className="pos-layout">
        {/* Products */}
        <div>
          <div className="search-bar">
            <input className="input" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input" style={{ width:'auto', minWidth:'100px' }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="product-grid">
            {filteredProducts.length === 0 && <p className="text-muted">No products found</p>}
            {filteredProducts.map(p => (
              <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                <div className="product-name">{p.name}</div>
                <div className="product-price">KSh {p.price}</div>
                <div className="product-stock">Stock: {p.stock}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="cart-panel">
          {activeOrder && (
            <div className="active-order-banner">
              <span className="text-accent text-bold">📋 {activeOrder.table_name} {activeOrder.order_number}</span>
              <button className="btn-icon" onClick={clearActiveOrder}>✕</button>
            </div>
          )}

          <div className="section-title">Cart</div>
          {cart.length === 0 && <p className="text-muted">No items yet</p>}
          {cart.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-row">
                <span className="cart-item-name">{item.product_name}</span>
                <span className="cart-item-price">KSh {item.subtotal}</span>
              </div>
              <div className="cart-qty-row">
                <button className="qty-btn" onClick={() => updateQty(item.product_id, -1)}>−</button>
                <span>{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQty(item.product_id, 1)}>+</button>
                <button className="btn-icon text-sm" style={{ marginLeft:'auto' }} onClick={() => removeFromCart(item.product_id)}>remove</button>
              </div>
            </div>
          ))}

          {message && <div className={`message ${message.startsWith("❌") ? "message-error" : "message-success"}`} style={{margin:"8px 14px 0",borderRadius:"8px"}}>{message}</div>}
          <div className="cart-total-panel">
            <div className="total-row">
              <span>Total</span>
              <span className="total-amount">KSh {total}</span>
            </div>

            {!activeOrder ? (
              <button className="btn btn-secondary mb-8" onClick={saveTable}>💾 Save Table</button>
            ) : (
              <button className="btn mb-8" style={{ background:'var(--card)', border:'1px solid var(--green)', color:'white' }} onClick={updateTable}>🔄 Update Table</button>
            )}

            {activeOrder ? (
              <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>💳 Submit Payment</button>
            ) : (
              <>
                <>
{/* Payment Fields */}
      <div className="text-sm text-muted mb-8">Payment Method(s)</div>
      {splits.map((split, idx) => (
        <div key={idx} style={{border:'1px solid var(--card)',borderRadius:'8px',padding:'10px',marginBottom:'8px'}}>
          <div style={{display:'flex',gap:'8px',marginBottom:'8px',alignItems:'center'}}>
            <select className="input" style={{margin:0,flex:1}} value={split.method}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,method:e.target.value,ref:''} : s))}>
              <option value="cash">💵 Cash</option>
              <option value="mpesa">📱 Mpesa</option>
              <option value="card">💳 Card</option>
              <option value="billout">📋 Billout</option>
            </select>
            <input className="input" type="number" placeholder="Amount" style={{margin:0,flex:1}}
              value={split.amount}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,amount:e.target.value} : s))} />
            {splits.length > 1 && (
              <button className="btn btn-sm btn-primary" onClick={() => setSplits(splits.filter((_,i) => i!==idx))}>✕</button>
            )}
          </div>
          {split.method === 'mpesa' && (
            <input className="input" placeholder="📱 Mpesa code" style={{margin:0}}
              value={split.ref}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,ref:e.target.value.toUpperCase()} : s))} />
          )}
          {split.method === 'card' && (
            <input className="input" placeholder="💳 Auth number" style={{margin:0}}
              value={split.ref}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,ref:e.target.value.toUpperCase()} : s))} />
          )}
          {split.method === 'billout' && (
            <input className="input" placeholder="📋 Billout reference" style={{margin:0}}
              value={split.ref}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,ref:e.target.value.toUpperCase()} : s))} />
          )}
        </div>
      ))}
      <button className="btn btn-sm" style={{background:'var(--card)',color:'white',marginBottom:'8px'}}
        onClick={() => setSplits([...splits, {method:'cash',amount:'',ref:''}])}>
        + Add Payment Method
      </button>
      <div className="text-sm text-muted mb-8">
        Paid: KSh {splits.reduce((a,s) => a+(parseFloat(s.amount)||0),0)} / KSh {total}
      </div>
    </>
                <button className="btn btn-primary mt-8" onClick={handleCheckout}>✅ Submit Payment</button>
              </>
            )}
          </div>
        </div>
      </div>}


      {view === 'tables' && showTableEdit && activeOrder && (
        <div className="card" style={{margin:'12px 16px',border:'1px solid var(--accent)'}}>
          <div className="flex-between mb-8">
            <div className="text-accent text-bold">✏️ {activeOrder.table_name} — {activeOrder.order_number}</div>
            <button className="btn-icon" onClick={clearActiveOrder}>✕</button>
          </div>
          <div className="section-title">Items</div>
          {cart.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-row">
                <span className="cart-item-name">{item.product_name}</span>
                <span className="cart-item-price">KSh {item.subtotal}</span>
              </div>
              <div className="cart-qty-row">
                <button className="qty-btn" onClick={() => updateQty(item.product_id, -1)}>−</button>
                <span>{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQty(item.product_id, 1)}>+</button>
                <button className="btn-icon text-sm" style={{marginLeft:'auto'}} onClick={() => removeFromCart(item.product_id)}>remove</button>
              </div>
            </div>
          ))}
          <div className="total-row" style={{margin:'8px 0'}}>
            <span>Total</span>
            <span className="total-amount">KSh {total}</span>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
            <button className="btn btn-success" style={{flex:1}} onClick={updateTable}>🔄 Update Table</button>
            <button className="btn btn-primary" style={{flex:1}} onClick={() => setShowPayModal(true)}>💳 Submit</button>
          </div>
        </div>
      )}
      {/* Pay Modal */}
      {showPayModal && activeOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>💳 Submit Payment</h3>
            <div className="modal-row"><span>🔖 {activeOrder.order_number}</span><span>🪑 {activeOrder.table_name}</span></div>
            <div className="text-muted text-sm mb-8">👤 Waiter: {activeOrder.waiter_name}</div>
            <div className="modal-divider" />
            {activeOrder.items?.map(i => (
              <div key={i.product_id} className="modal-row">
                <span>{i.product_name} x{i.quantity}</span><span>KSh {i.subtotal}</span>
              </div>
            ))}
            <div className="modal-divider" />
            <div className="modal-row text-bold" style={{ fontSize:'15px', marginBottom:'12px' }}>
              <span>Total</span><span className="text-accent">KSh {activeOrder.total}</span>
            </div>
            <>
{/* Payment Fields */}
      <div className="text-sm text-muted mb-8">Payment Method(s)</div>
      {splits.map((split, idx) => (
        <div key={idx} style={{border:'1px solid var(--card)',borderRadius:'8px',padding:'10px',marginBottom:'8px'}}>
          <div style={{display:'flex',gap:'8px',marginBottom:'8px',alignItems:'center'}}>
            <select className="input" style={{margin:0,flex:1}} value={split.method}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,method:e.target.value,ref:''} : s))}>
              <option value="cash">💵 Cash</option>
              <option value="mpesa">📱 Mpesa</option>
              <option value="card">💳 Card</option>
              <option value="billout">📋 Billout</option>
            </select>
            <input className="input" type="number" placeholder="Amount" style={{margin:0,flex:1}}
              value={split.amount}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,amount:e.target.value} : s))} />
            {splits.length > 1 && (
              <button className="btn btn-sm btn-primary" onClick={() => setSplits(splits.filter((_,i) => i!==idx))}>✕</button>
            )}
          </div>
          {split.method === 'mpesa' && (
            <input className="input" placeholder="📱 Mpesa code" style={{margin:0}}
              value={split.ref}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,ref:e.target.value.toUpperCase()} : s))} />
          )}
          {split.method === 'card' && (
            <input className="input" placeholder="💳 Auth number" style={{margin:0}}
              value={split.ref}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,ref:e.target.value.toUpperCase()} : s))} />
          )}
          {split.method === 'billout' && (
            <input className="input" placeholder="📋 Billout reference" style={{margin:0}}
              value={split.ref}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s,ref:e.target.value.toUpperCase()} : s))} />
          )}
        </div>
      ))}
      <button className="btn btn-sm" style={{background:'var(--card)',color:'white',marginBottom:'8px'}}
        onClick={() => setSplits([...splits, {method:'cash',amount:'',ref:''}])}>
        + Add Payment Method
      </button>
      <div className="text-sm text-muted mb-8">
        Paid: KSh {splits.reduce((a,s) => a+(parseFloat(s.amount)||0),0)} / KSh {activeOrder.total}
      </div>
    </>
            {message && message.startsWith("❌") && <div className="message message-error">{message}</div>}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={completeOrder}>💳 Submit Payment</button>
              <button className="btn btn-muted" onClick={() => { setShowPayModal(false); resetPayment(); setMessage(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="modal-overlay">
          <div className="modal modal-white">
            <div ref={receiptRef}>
              <div className="receipt-header">
                <div className="receipt-title">Javari</div>
                <div className="receipt-sub">📍 Loresho, Nairobi</div>
              </div>
              <div className="modal-divider-white" />
              <div className="receipt-meta">
                {receipt.orderNumber && <span>🔖 {receipt.orderNumber}</span>}
                {receipt.tableName && <span>🪑 {receipt.tableName}</span>}
              </div>
              <div className="receipt-meta">
                <span>👤 Cashier: {receipt.cashier}</span>
                <span>📅 {receipt.date.split(',')[0]}</span>
              </div>
              <div className="receipt-meta">
                <span>🤵 Waiter: {receipt.waiterName}</span>
                <span>🕐 {receipt.date.split(',')[1]?.trim()}</span>
              </div>
              <div className="modal-divider-white" />
              {receipt.items.map((i, idx) => (
                <div key={idx} className="receipt-item">
                  <span>{i.product_name} x{i.quantity}</span><span>KSh {i.subtotal}</span>
                </div>
              ))}
              <div className="modal-divider-white" />
              <div className="receipt-total"><span>TOTAL</span><span>KSh {receipt.total}</span></div>
              <div style={{ marginTop:'6px' }}>
                {receipt.splits && receipt.splits.length > 0 ? (
                  receipt.splits.map((s, i) => (
                    <div key={i} className="receipt-item">
                      <span>{s.method === 'mpesa' ? '📱 Mpesa' : s.method === 'card' ? '💳 Card' : s.method === 'billout' ? '📋 Billout' : '💵 Cash'}{s.ref ? ` (${s.ref})` : ''}</span>
                      <span>KSh {s.amount}</span>
                    </div>
                  ))
                ) : (
                  <div className="receipt-item"><span>Payment</span><span>{receipt.paymentMethod}</span></div>
                )}
                {receipt.paymentMethod === 'cash' && <>
                  <div className="receipt-item"><span>Amount Paid</span><span>KSh {receipt.amountPaid}</span></div>
                  <div className="receipt-item"><span>Change</span><span>KSh {receipt.change}</span></div>
                </>}

              </div>
              <div className="modal-divider-white" />
              <div style={{ textAlign:'center', fontSize:'12px', color:'#333' }}>Thank you for your visit! 🙏</div>
              <div className="receipt-note">📋 <strong>Note to Waiter:</strong> Submit this receipt attached with the bill to the cashier.</div>
            </div>
            <div className="modal-actions">
              <button className="btn" style={{ background:'#1a1a2e', color:'white' }} onClick={printReceipt}>🖨️ Print</button>
              <button className="btn btn-primary" onClick={() => setReceipt(null)}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">🔒 Enter Waiter PIN</div>
            <p className="text-muted text-sm mb-8">Enter your PIN to save this order to a table</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '16px 0' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: '40px', height: '40px', border: '2px solid var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                  {pinInput[i] ? '●' : ''}
                </div>
              ))}
            </div>
            {pinError && <div className="message message-error">{pinError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '12px 0' }}>
              {[1,2,3,4,5,6,7,8,9,'C',0,'⌫'].map((k, i) => (
                <button key={i} className="btn" style={{ background: k === '' ? 'transparent' : 'var(--card)', color: 'white', fontSize: '18px', padding: '12px', border: 'none' }}
                  onClick={() => {
                    if (k === '⌫') { setPinInput(p => p.slice(0,-1)); }
                    else if (k === 'C') { setPinInput(''); }
                    else if (k !== '' && pinInput.length < 4) { 
                      const next = pinInput + k;
                      setPinInput(next);
                      if (next.length === 4) {
                        const savedPin = localStorage.getItem('userpin');
                        if (next === savedPin) { setPinError(''); confirmSaveTable(); }
                        else { setPinError('❌ Wrong PIN!'); setPinInput(''); }
                      }
                    }
                  }}
                  disabled={k === ''}
                >{k}</button>
              ))}
            </div>
            <button className="btn btn-muted" onClick={() => setShowPinModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
