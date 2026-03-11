import { useState, useEffect, useRef } from 'react';
import api from './api';

export default function POS({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mpesaCode, setMpesaCode] = useState('');
  const [cardAuth, setCardAuth] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const receiptRef = useRef();

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

  const resetPayment = () => { setAmountPaid(''); setPaymentMethod('cash'); setMpesaCode(''); setCardAuth(''); };

  const getNextTableNumber = () => {
    if (pendingOrders.length === 0) return 1;
    const nums = pendingOrders.map(o => { const m = o.table_name.match(/Table (\d+)/); return m ? parseInt(m[1]) : 0; });
    return Math.max(...nums) + 1;
  };

  const loadOrder = (order) => {
    setActiveOrder(order);
    setCart(order.items.map(i => ({ product_id: i.product_id, product_name: i.product_name, price: i.price, quantity: i.quantity, subtotal: i.subtotal })));
    setMessage(`📋 Editing ${order.table_name}`);
  };

  const clearActiveOrder = () => { setActiveOrder(null); setCart([]); resetPayment(); setMessage(''); };

  const saveTable = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    const tableName = `Table ${getNextTableNumber()}`;
    try {
      await api.post('/orders/', {
        table_name: tableName, waiter_name: user.name,
        items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
        total
      });
      setMessage(`✅ Saved as ${tableName}!`); setCart([]); setActiveOrder(null); fetchOrders();
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
    if (paymentMethod === 'cash' && (!amountPaid || parseFloat(amountPaid) < orderTotal)) return '❌ Insufficient cash amount!';
    if (paymentMethod === 'mpesa' && !mpesaCode.trim()) return '❌ Enter Mpesa transaction code!';
    if (paymentMethod === 'card' && !cardAuth.trim()) return '❌ Enter card authorization number!';
    return null;
  };

  const completeOrder = async () => {
    const err = validatePayment(activeOrder.total);
    if (err) return setMessage(err);
    try {
      const res = await api.post(`/orders/${activeOrder.id}/complete`, {
        amount_paid: paymentMethod === 'cash' ? parseFloat(amountPaid) : activeOrder.total,
        payment_method: paymentMethod
      });
      setReceipt({ orderNumber: activeOrder.order_number, tableName: activeOrder.table_name, waiterName: activeOrder.waiter_name, items: activeOrder.items, total: activeOrder.total, amountPaid: paymentMethod === 'cash' ? parseFloat(amountPaid) : activeOrder.total, change: res.data.change_due, cashier: user.name, paymentMethod, mpesaCode: paymentMethod === 'mpesa' ? mpesaCode : null, cardAuth: paymentMethod === 'card' ? cardAuth : null, date: new Date().toLocaleString() });
      resetPayment(); setActiveOrder(null); setShowPayModal(false); setCart([]);
      fetchOrders(); fetchProducts();
    } catch { setMessage('❌ Payment failed!'); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    const err = validatePayment(total);
    if (err) return setMessage(err);
    try {
      const res = await api.post('/sales/', { items: cart, amount_paid: paymentMethod === 'cash' ? parseFloat(amountPaid) : total, payment_method: paymentMethod });
      setReceipt({ orderNumber: null, tableName: null, waiterName: user.name, items: cart, total, amountPaid: paymentMethod === 'cash' ? parseFloat(amountPaid) : total, change: res.data.change_due, cashier: user.name, paymentMethod, mpesaCode: paymentMethod === 'mpesa' ? mpesaCode : null, cardAuth: paymentMethod === 'card' ? cardAuth : null, date: new Date().toLocaleString() });
      setCart([]); resetPayment(); fetchProducts();
    } catch { setMessage('❌ Sale failed!'); }
  };

  const printBill = (order) => {
    const win = window.open('', '_blank');
    const openedAt = new Date(order.created_at);
    const rows = order.items.map(i => `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>${i.product_name} x${i.quantity}</span><span>KSh ${i.subtotal}</span></div>`).join('');
    win.document.write(`<html><head><title>Bill</title><style>body{font-family:monospace;width:300px;margin:0 auto;padding:16px;font-size:13px}h2{text-align:center;margin:0}.meta{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px}.divider{border-top:1px dashed #000;margin:8px 0}.total{font-weight:bold;font-size:14px}@media print{button{display:none}}</style></head><body><h2>Triple Two Loresho</h2><p style="text-align:center;font-size:12px">📍 Loresho, Nairobi</p><div class="divider"></div><div class="meta"><span>🔖 ${order.order_number}</span><span>🪑 ${order.table_name}</span></div><div class="meta"><span>👤 ${order.waiter_name}</span><span>📅 ${openedAt.toLocaleDateString()}</span></div><div class="meta"><span></span><span>🕐 ${openedAt.toLocaleTimeString()}</span></div><div class="divider"></div>${rows}<div class="divider"></div><div class="meta total"><span>TOTAL</span><span>KSh ${order.total}</span></div><div class="divider"></div><p style="text-align:center">Please present this bill to the cashier</p><button onclick="window.print()" style="width:100%;padding:8px;margin-top:12px">🖨️ Print Bill</button></body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  const printReceipt = () => {
    const content = receiptRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;width:300px;margin:0 auto;padding:16px;font-size:13px}.divider{border-top:1px dashed #000;margin:8px 0}@media print{button{display:none}}</style></head><body>${content}</body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  const PaymentFields = ({ orderTotal }) => (
    <>
      <div className="text-sm text-muted mb-8">Payment Method</div>
      <div className="pay-methods">
        {['cash','mpesa','card'].map(m => (
          <button key={m} className={`pay-method-btn ${paymentMethod === m ? 'active' : 'inactive'}`} onClick={() => setPaymentMethod(m)}>
            {m === 'cash' ? '💵 Cash' : m === 'mpesa' ? '📱 Mpesa' : '💳 Card'}
          </button>
        ))}
      </div>
      {paymentMethod === 'cash' && (
        <>
          <input className="input" type="number" placeholder="💵 Cash amount received" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
          {amountPaid > 0 && (
            <div className={parseFloat(amountPaid) >= orderTotal ? 'change-positive' : 'change-negative'}>
              Change: KSh {(parseFloat(amountPaid) - orderTotal).toFixed(2)}
            </div>
          )}
        </>
      )}
      {paymentMethod === 'mpesa' && (
        <input className="input" placeholder="📱 Mpesa code e.g. QJK7X4ABCD" value={mpesaCode} onChange={e => setMpesaCode(e.target.value.toUpperCase())} />
      )}
      {paymentMethod === 'card' && (
        <input className="input" placeholder="💳 Card authorization number" value={cardAuth} onChange={e => setCardAuth(e.target.value.toUpperCase())} />
      )}
    </>
  );

  return (
    <div className="page">
      <div className="header">
        <h2>🛒 POS</h2>
        <div className="header-right">
          <span className="header-user">👤 {user.name}</span>
          <button className="btn btn-primary btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {message && <div className={`message ${message.startsWith('❌') ? 'message-error' : 'message-success'}`}>{message}</div>}

      {pendingOrders.length > 0 && (
        <div className="pending-section">
          <div className="section-title">🕐 Awaiting Payment</div>
          <div className="pending-grid">
            {pendingOrders.map(o => (
              <div key={o.id} className={`pending-card ${activeOrder?.id === o.id ? 'active' : 'inactive'}`}>
                <div onClick={() => loadOrder(o)} style={{ cursor:'pointer' }}>
                  <div className="flex-between mb-8">
                    <span className="text-bold text-sm" style={{ color: activeOrder?.id === o.id ? 'white' : 'var(--accent)' }}>{o.order_number}</span>
                    <span className="text-bold text-sm" style={{ color: activeOrder?.id === o.id ? 'white' : 'var(--accent)' }}>{o.table_name}</span>
                  </div>
                  <div className="pending-meta">
                    <span>👤 {o.waiter_name}</span>
                    <span>🕐 {new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <div className="pending-meta">
                    <span>{o.items?.length || 0} items</span>
                    <span className="text-bold" style={{ color: activeOrder?.id === o.id ? 'white' : 'var(--accent)' }}>KSh {o.total}</span>
                  </div>
                </div>
                <div className="pending-actions">
                  <button className="pending-btn pending-btn-bill" onClick={e => { e.stopPropagation(); printBill(o); }}>🧾 Bill</button>
                  <button className="pending-btn pending-btn-pay" onClick={e => { e.stopPropagation(); loadOrder(o); setShowPayModal(true); }}>💳 Pay</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pos-layout">
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
              <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>💳 Receive Payment</button>
            ) : (
              <>
                <PaymentFields orderTotal={total} />
                <button className="btn btn-primary mt-8" onClick={handleCheckout}>✅ Receive Payment</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && activeOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>💳 Receive Payment</h3>
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
            <PaymentFields orderTotal={activeOrder.total} />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={completeOrder}>✅ Confirm</button>
              <button className="btn btn-muted" onClick={() => { setShowPayModal(false); resetPayment(); }}>Cancel</button>
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
                <div className="receipt-title">Triple Two Loresho</div>
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
                <div className="receipt-item"><span>Payment</span><span>{receipt.paymentMethod === 'mpesa' ? '📱 Mpesa' : receipt.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}</span></div>
                {receipt.paymentMethod === 'cash' && <>
                  <div className="receipt-item"><span>Amount Paid</span><span>KSh {receipt.amountPaid}</span></div>
                  <div className="receipt-item"><span>Change</span><span>KSh {receipt.change}</span></div>
                </>}
                {receipt.paymentMethod === 'mpesa' && <div className="receipt-item"><span>Mpesa Code</span><span style={{ fontWeight:'bold' }}>{receipt.mpesaCode}</span></div>}
                {receipt.paymentMethod === 'card' && <div className="receipt-item"><span>Auth No.</span><span style={{ fontWeight:'bold' }}>{receipt.cardAuth}</span></div>}
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
    </div>
  );
}
