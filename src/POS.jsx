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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchOrders();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
        : i
      ));
    } else {
      setCart([...cart, { product_id: product.id, product_name: product.name, price: product.price, quantity: 1, subtotal: product.price }]);
    }
  };

  const removeFromCart = (product_id) => setCart(cart.filter(i => i.product_id !== product_id));

  const updateQty = (product_id, delta) => {
    setCart(cart.map(i => {
      if (i.product_id !== product_id) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      return { ...i, quantity: newQty, subtotal: newQty * i.price };
    }).filter(Boolean));
  };

  const resetPayment = () => {
    setAmountPaid('');
    setPaymentMethod('cash');
    setMpesaCode('');
    setCardAuth('');
  };

  const total = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const change = amountPaid ? amountPaid - total : 0;

  const getNextTableNumber = () => {
    if (pendingOrders.length === 0) return 1;
    const nums = pendingOrders.map(o => {
      const match = o.table_name.match(/Table (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    return Math.max(...nums) + 1;
  };

  const loadOrder = (order) => {
    setActiveOrder(order);
    setCart(order.items.map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.subtotal
    })));
    setMessage(`📋 Editing ${order.table_name} — add items then Update or Pay`);
  };

  const clearActiveOrder = () => {
    setActiveOrder(null);
    setCart([]);
    resetPayment();
    setMessage('');
  };

  const saveTable = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    const tableName = `Table ${getNextTableNumber()}`;
    try {
      await api.post('/orders/', {
        table_name: tableName,
        waiter_name: user.name,
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
      });
      setMessage(`✅ Saved as ${tableName}!`);
      setCart([]);
      setActiveOrder(null);
      fetchOrders();
    } catch {
      setMessage('❌ Failed to save order');
    }
  };

  const updateTable = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    try {
      await api.put(`/orders/${activeOrder.id}`, {
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
      });
      setMessage(`✅ ${activeOrder.table_name} updated!`);
      setCart([]);
      setActiveOrder(null);
      fetchOrders();
    } catch {
      setMessage('❌ Failed to update order');
    }
  };

  const validatePayment = (orderTotal) => {
    if (paymentMethod === 'cash' && (!amountPaid || amountPaid < orderTotal)) return '❌ Insufficient cash amount!';
    if (paymentMethod === 'mpesa' && !mpesaCode.trim()) return '❌ Enter Mpesa transaction code!';
    if (paymentMethod === 'card' && !cardAuth.trim()) return '❌ Enter card authorization number!';
    return null;
  };

  const buildReceiptPayment = () => {
    if (paymentMethod === 'mpesa') return { method: 'mpesa', ref: mpesaCode, amountPaid: total, change: 0 };
    if (paymentMethod === 'card') return { method: 'card', ref: cardAuth, amountPaid: total, change: 0 };
    return { method: 'cash', ref: null, amountPaid: parseFloat(amountPaid), change: parseFloat(amountPaid) - total };
  };

  const completeOrder = async () => {
    const err = validatePayment(activeOrder.total);
    if (err) return setMessage(err);
    const payment = buildReceiptPayment();
    try {
      const res = await api.post(`/orders/${activeOrder.id}/complete`, {
        amount_paid: paymentMethod === 'cash' ? parseFloat(amountPaid) : activeOrder.total,
        payment_method: paymentMethod
      });
      setReceipt({
        orderNumber: activeOrder.order_number,
        tableName: activeOrder.table_name,
        waiterName: activeOrder.waiter_name,
        items: activeOrder.items,
        total: activeOrder.total,
        amountPaid: payment.amountPaid,
        change: res.data.change_due,
        cashier: user.name,
        paymentMethod,
        mpesaCode: paymentMethod === 'mpesa' ? mpesaCode : null,
        cardAuth: paymentMethod === 'card' ? cardAuth : null,
        date: new Date().toLocaleString(),
      });
      resetPayment();
      setActiveOrder(null);
      setShowPayModal(false);
      setCart([]);
      fetchOrders();
      fetchProducts();
    } catch {
      setMessage('❌ Payment failed!');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return setMessage('❌ Cart is empty!');
    const err = validatePayment(total);
    if (err) return setMessage(err);
    const payment = buildReceiptPayment();
    try {
      const res = await api.post('/sales/', {
        items: cart,
        amount_paid: payment.amountPaid,
        payment_method: paymentMethod
      });
      setReceipt({
        orderNumber: null,
        tableName: null,
        waiterName: user.name,
        items: cart,
        total,
        amountPaid: payment.amountPaid,
        change: res.data.change_due,
        cashier: user.name,
        paymentMethod,
        mpesaCode: paymentMethod === 'mpesa' ? mpesaCode : null,
        cardAuth: paymentMethod === 'card' ? cardAuth : null,
        date: new Date().toLocaleString(),
      });
      setCart([]);
      resetPayment();
      fetchProducts();
    } catch {
      setMessage('❌ Sale failed!');
    }
  };

  const printBill = (order) => {
    const win = window.open('', '_blank');
    const openedAt = new Date(order.created_at);
    const itemRows = order.items.map(i =>
      `<div class="row"><span>${i.product_name} x${i.quantity}</span><span>KSh ${i.subtotal}</span></div>`
    ).join('');
    win.document.write(`
      <html><head><title>Bill - ${order.table_name}</title>
      <style>
        body { font-family: monospace; width: 300px; margin: 0 auto; padding: 16px; font-size: 13px; }
        h2 { text-align: center; margin: 0; font-size: 16px; }
        .center { text-align: center; margin: 2px 0; font-size: 12px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
        .total { font-weight: bold; font-size: 14px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>Triple Two Loresho</h2>
      <p class="center">📍 Loresho, Nairobi</p>
      <div class="divider"></div>
      <div class="meta"><span>🔖 ${order.order_number}</span><span>🪑 ${order.table_name}</span></div>
      <div class="meta"><span>👤 ${order.waiter_name}</span><span>📅 ${openedAt.toLocaleDateString()}</span></div>
      <div class="meta"><span></span><span>🕐 ${openedAt.toLocaleTimeString()}</span></div>
      <div class="divider"></div>
      ${itemRows}
      <div class="divider"></div>
      <div class="row total"><span>TOTAL</span><span>KSh ${order.total}</span></div>
      <div class="divider"></div>
      <p class="center">Please present this bill to the cashier</p>
      <button onclick="window.print()" style="width:100%;padding:8px;margin-top:12px;font-size:14px;cursor:pointer">🖨️ Print Bill</button>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const printReceipt = () => {
    const content = receiptRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: monospace; width: 300px; margin: 0 auto; padding: 16px; font-size: 13px; }
        h2 { text-align: center; margin: 0; font-size: 16px; }
        .center { text-align: center; margin: 2px 0; font-size: 12px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .total { font-weight: bold; font-size: 14px; }
        @media print { button { display: none; } }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const payMethodBtnStyle = (method) => ({
    flex: 1,
    padding: '8px',
    background: paymentMethod === method ? '#e94560' : '#0f3460',
    color: 'white',
    border: paymentMethod === method ? '2px solid white' : '1px solid #444',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: paymentMethod === method ? 'bold' : 'normal'
  });

  const s = { padding:'8px', borderRadius:'6px', border:'none', background:'#16213e', color:'white', width:'100%', marginBottom:'8px', boxSizing:'border-box' };
  const sModal = { padding:'8px', borderRadius:'6px', border:'1px solid #0f3460', background:'#0a1628', color:'white', width:'100%', marginBottom:'8px', boxSizing:'border-box' };

  // Reusable payment fields component
  const PaymentFields = ({ inputStyle, orderTotal }) => (
    <>
      <p style={{ margin:'0 0 6px', fontSize:'12px', color:'#aaa' }}>Payment Method</p>
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
        <button style={payMethodBtnStyle('cash')} onClick={() => setPaymentMethod('cash')}>💵 Cash</button>
        <button style={payMethodBtnStyle('mpesa')} onClick={() => setPaymentMethod('mpesa')}>📱 Mpesa</button>
        <button style={payMethodBtnStyle('card')} onClick={() => setPaymentMethod('card')}>💳 Card</button>
      </div>

      {paymentMethod === 'cash' && (
        <>
          <input type="number" placeholder="💵 Cash amount received" value={amountPaid}
            onChange={e => setAmountPaid(e.target.value)} style={inputStyle} />
          {amountPaid > 0 && (
            <div style={{ marginBottom:'8px', color: amountPaid >= orderTotal ? '#4caf50' : '#e94560', fontSize:'13px' }}>
              Change: KSh {(amountPaid - orderTotal).toFixed(2)}
            </div>
          )}
        </>
      )}

      {paymentMethod === 'mpesa' && (
        <input
          placeholder="📱 Mpesa transaction code e.g. QJK7X4ABCD"
          value={mpesaCode}
          onChange={e => setMpesaCode(e.target.value.toUpperCase())}
          style={inputStyle}
        />
      )}

      {paymentMethod === 'card' && (
        <input
          placeholder="💳 Card authorization number"
          value={cardAuth}
          onChange={e => setCardAuth(e.target.value.toUpperCase())}
          style={inputStyle}
        />
      )}
    </>
  );

  return (
    <div style={{ background:'#1a1a2e', minHeight:'100vh', color:'white', padding:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <h2 style={{ color:'#e94560', margin:0 }}>🛒 POS</h2>
        <div>
          <span style={{ marginRight:'12px' }}>👤 {user.name}</span>
          <button onClick={onLogout} style={{ padding:'6px 12px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>Logout</button>
        </div>
      </div>

      {message && <p style={{ color:'#4caf50', marginBottom:'8px' }}>{message}</p>}

      {pendingOrders.length > 0 && (
        <div style={{ marginBottom:'16px' }}>
          <h3 style={{ color:'#e94560', margin:'0 0 8px' }}>🕐 Awaiting Payment</h3>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {pendingOrders.map(o => (
              <div key={o.id}
                style={{ background: activeOrder?.id === o.id ? '#e94560' : '#0f3460', padding:'10px 12px', borderRadius:'8px', border:'1px solid #e94560', minWidth:'180px' }}>
                <div onClick={() => loadOrder(o)} style={{ cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontWeight:'bold', color: activeOrder?.id === o.id ? 'white' : '#e94560', fontSize:'13px' }}>{o.order_number}</span>
                    <span style={{ fontWeight:'bold', color: activeOrder?.id === o.id ? 'white' : '#e94560', fontSize:'13px' }}>{o.table_name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#ccc', marginBottom:'2px' }}>
                    <span>👤 {o.waiter_name}</span>
                    <span>🕐 {new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'6px' }}>
                    <span style={{ color:'#ccc' }}>{o.items?.length || 0} items</span>
                    <span style={{ color: activeOrder?.id === o.id ? 'white' : '#e94560', fontWeight:'bold' }}>KSh {o.total}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'4px' }}>
                  <button onClick={e => { e.stopPropagation(); printBill(o); }}
                    style={{ flex:1, fontSize:'11px', background:'#1a1a2e', color:'white', border:'1px solid #e94560', borderRadius:'4px', padding:'4px', cursor:'pointer' }}>
                    🧾 Bill
                  </button>
                  <button onClick={e => { e.stopPropagation(); loadOrder(o); setShowPayModal(true); }}
                    style={{ flex:1, fontSize:'11px', background:'#e94560', color:'white', border:'none', borderRadius:'4px', padding:'4px', cursor:'pointer' }}>
                    💳 Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:'280px' }}>
          <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
            <input placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex:1, padding:'8px', borderRadius:'6px', border:'none', background:'#16213e', color:'white' }} />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding:'8px', borderRadius:'6px', border:'none', background:'#16213e', color:'white' }}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px' }}>
            {filteredProducts.length === 0 && <p style={{ color:'#888' }}>No products found</p>}
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p)}
                style={{ background:'#16213e', padding:'12px', borderRadius:'8px', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:'bold' }}>{p.name}</div>
                <div style={{ color:'#e94560' }}>KSh {p.price}</div>
                <div style={{ fontSize:'12px', color:'#888' }}>Stock: {p.stock}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width:'280px' }}>
          {activeOrder && (
            <div style={{ background:'#0f3460', padding:'8px 12px', borderRadius:'8px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#e94560', fontWeight:'bold' }}>📋 {activeOrder.table_name} {activeOrder.order_number}</span>
              <button onClick={clearActiveOrder} style={{ background:'transparent', color:'#888', border:'none', cursor:'pointer', fontSize:'18px' }}>✕</button>
            </div>
          )}

          <h3 style={{ color:'#e94560', margin:'0 0 8px' }}>Cart</h3>
          {cart.length === 0 && <p style={{ color:'#888' }}>No items yet</p>}
          {cart.map(item => (
            <div key={item.product_id} style={{ background:'#16213e', padding:'10px', borderRadius:'8px', marginBottom:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span>{item.product_name}</span>
                <span style={{ color:'#e94560' }}>KSh {item.subtotal}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
                <button onClick={() => updateQty(item.product_id, -1)} style={{ background:'#0f3460', color:'white', border:'none', borderRadius:'4px', padding:'2px 8px', cursor:'pointer' }}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, 1)} style={{ background:'#0f3460', color:'white', border:'none', borderRadius:'4px', padding:'2px 8px', cursor:'pointer' }}>+</button>
                <button onClick={() => removeFromCart(item.product_id)} style={{ marginLeft:'auto', fontSize:'11px', background:'transparent', color:'#888', border:'none', cursor:'pointer' }}>remove</button>
              </div>
            </div>
          ))}

          <div style={{ background:'#16213e', padding:'12px', borderRadius:'8px', marginTop:'8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span>Total:</span><span style={{ color:'#e94560', fontWeight:'bold' }}>KSh {total}</span>
            </div>

            {!activeOrder ? (
              <button onClick={saveTable} style={{ width:'100%', padding:'10px', background:'#0f3460', color:'white', border:'1px solid #e94560', borderRadius:'6px', cursor:'pointer', marginBottom:'8px' }}>
                💾 Save Table
              </button>
            ) : (
              <button onClick={updateTable} style={{ width:'100%', padding:'10px', background:'#0f3460', color:'white', border:'1px solid #4caf50', borderRadius:'6px', cursor:'pointer', marginBottom:'8px' }}>
                🔄 Update Table
              </button>
            )}

            {activeOrder ? (
              <button onClick={() => setShowPayModal(true)} style={{ width:'100%', padding:'10px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
                💳 Receive Payment
              </button>
            ) : (
              <>
                <PaymentFields inputStyle={s} orderTotal={total} />
                <button onClick={handleCheckout} style={{ width:'100%', padding:'10px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', marginTop:'4px' }}>
                  ✅ Receive Payment
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && activeOrder && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#16213e', padding:'24px', borderRadius:'12px', width:'300px', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ color:'#e94560', marginTop:0 }}>💳 Receive Payment</h3>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px' }}>
              <span>🔖 {activeOrder.order_number}</span><span>🪑 {activeOrder.table_name}</span>
            </div>
            <div style={{ fontSize:'13px', marginBottom:'8px', color:'#aaa' }}>👤 Waiter: {activeOrder.waiter_name}</div>
            <hr style={{ borderColor:'#0f3460', margin:'10px 0' }} />
            {activeOrder.items?.map(i => (
              <div key={i.product_id} style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', marginBottom:'4px' }}>
                <span>{i.product_name} x{i.quantity}</span>
                <span>KSh {i.subtotal}</span>
              </div>
            ))}
            <hr style={{ borderColor:'#0f3460', margin:'10px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
              <strong>Total:</strong><strong style={{ color:'#e94560' }}>KSh {activeOrder.total}</strong>
            </div>

            <PaymentFields inputStyle={sModal} orderTotal={activeOrder.total} />

            <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
              <button onClick={completeOrder} style={{ flex:1, padding:'10px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>✅ Confirm</button>
              <button onClick={() => { setShowPayModal(false); resetPayment(); }}
                style={{ flex:1, padding:'10px', background:'#888', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'white', color:'black', padding:'24px', borderRadius:'12px', width:'300px', fontFamily:'monospace', maxHeight:'90vh', overflowY:'auto' }}>
            <div ref={receiptRef}>
              <h2 style={{ textAlign:'center', margin:'0 0 2px', fontSize:'18px' }}>Triple Two Loresho</h2>
              <p style={{ textAlign:'center', margin:'2px 0', fontSize:'12px' }}>📍 Loresho, Nairobi</p>
              <div style={{ borderTop:'1px dashed #000', margin:'8px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'3px' }}>
                {receipt.orderNumber && <span>🔖 {receipt.orderNumber}</span>}
                {receipt.tableName && <span>🪑 {receipt.tableName}</span>}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'3px' }}>
                <span>👤 Cashier: {receipt.cashier}</span>
                <span>📅 {receipt.date.split(',')[0]}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'3px' }}>
                <span>🤵 Waiter: {receipt.waiterName}</span>
                <span>🕐 {receipt.date.split(',')[1]?.trim()}</span>
              </div>
              <div style={{ borderTop:'1px dashed #000', margin:'8px 0' }} />
              {receipt.items.map((i, idx) => (
                <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px' }}>
                  <span>{i.product_name} x{i.quantity}</span>
                  <span>KSh {i.subtotal}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px dashed #000', margin:'8px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'14px', marginBottom:'4px' }}>
                <span>TOTAL</span><span>KSh {receipt.total}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'2px' }}>
                <span>Payment</span>
                <span>{receipt.paymentMethod === 'mpesa' ? '📱 Mpesa' : receipt.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}</span>
              </div>
              {receipt.paymentMethod === 'cash' && (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'2px' }}>
                    <span>Amount Paid</span><span>KSh {receipt.amountPaid}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'2px' }}>
                    <span>Change</span><span>KSh {receipt.change}</span>
                  </div>
                </>
              )}
              {receipt.paymentMethod === 'mpesa' && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'2px' }}>
                  <span>Mpesa Code</span><span style={{ fontWeight:'bold' }}>{receipt.mpesaCode}</span>
                </div>
              )}
              {receipt.paymentMethod === 'card' && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'2px' }}>
                  <span>Auth No.</span><span style={{ fontWeight:'bold' }}>{receipt.cardAuth}</span>
                </div>
              )}
              <div style={{ borderTop:'1px dashed #000', margin:'8px 0' }} />
              <p style={{ textAlign:'center', fontSize:'12px', margin:'4px 0' }}>Thank you for your visit!</p>
              <p style={{ textAlign:'center', fontSize:'11px', color:'#555', margin:'2px 0' }}>Please come again 🙏</p>
              <div style={{ borderTop:'1px dashed #000', margin:'8px 0' }} />
              <div style={{ background:'#fff8e1', border:'1px dashed #f0a500', borderRadius:'4px', padding:'6px', textAlign:'center', fontSize:'11px', fontStyle:'italic', color:'#555' }}>
                📋 <strong>Note to Waiter:</strong> Submit this receipt attached with the bill to the cashier.
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
              <button onClick={printReceipt} style={{ flex:1, padding:'10px', background:'#1a1a2e', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>🖨️ Print</button>
              <button onClick={() => setReceipt(null)} style={{ flex:1, padding:'10px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>✕ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
