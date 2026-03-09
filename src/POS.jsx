import { useState, useEffect } from 'react';
import api from './api';

export default function POS({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/products/').then(res => setProducts(res.data));
  }, []);

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

  const removeFromCart = (product_id) => {
    setCart(cart.filter(i => i.product_id !== product_id));
  };

  const total = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const change = amountPaid ? amountPaid - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return setMessage('Cart is empty!');
    if (!amountPaid || amountPaid < total) return setMessage('Insufficient amount!');
    try {
      const res = await api.post('/sales/', {
        items: cart,
        amount_paid: parseFloat(amountPaid),
        payment_method: 'cash'
      });
      setMessage(`✅ Sale complete! Change: KSh ${res.data.change_due}`);
      setCart([]);
      setAmountPaid('');
    } catch (err) {
      setMessage('❌ Sale failed!');
    }
  };

  return (
    <div style={{ background:'#1a1a2e', minHeight:'100vh', color:'white', padding:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <h2 style={{ color:'#e94560', margin:0 }}>🛒 POS</h2>
        <div>
          <span style={{ marginRight:'12px' }}>👤 {user.name}</span>
          <button onClick={onLogout} style={{ padding:'6px 12px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
        {/* Products */}
        <div style={{ flex:1, minWidth:'280px' }}>
          <h3 style={{ color:'#e94560' }}>Products</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px' }}>
            {products.map(p => (
              <div key={p.id} onClick={() => addToCart(p)}
                style={{ background:'#16213e', padding:'12px', borderRadius:'8px', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:'bold' }}>{p.name}</div>
                <div style={{ color:'#e94560' }}>KSh {p.price}</div>
                <div style={{ fontSize:'12px', color:'#888' }}>Stock: {p.stock}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div style={{ width:'280px' }}>
          <h3 style={{ color:'#e94560' }}>Cart</h3>
          {cart.length === 0 && <p style={{ color:'#888' }}>No items yet</p>}
          {cart.map(item => (
            <div key={item.product_id} style={{ background:'#16213e', padding:'10px', borderRadius:'8px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div>{item.product_name}</div>
                <div style={{ fontSize:'12px', color:'#888' }}>x{item.quantity} @ KSh {item.price}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:'#e94560' }}>KSh {item.subtotal}</div>
                <button onClick={() => removeFromCart(item.product_id)}
                  style={{ fontSize:'11px', background:'transparent', color:'#888', border:'none', cursor:'pointer' }}>remove</button>
              </div>
            </div>
          ))}

          <div style={{ background:'#16213e', padding:'12px', borderRadius:'8px', marginTop:'8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span>Total:</span><span style={{ color:'#e94560', fontWeight:'bold' }}>KSh {total}</span>
            </div>
            <input
              type="number"
              placeholder="Amount paid"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              style={{ width:'100%', padding:'8px', borderRadius:'6px', border:'none', marginBottom:'8px', boxSizing:'border-box' }}
            />
            {amountPaid > 0 && <div style={{ marginBottom:'8px' }}>Change: KSh {change.toFixed(2)}</div>}
            <button onClick={handleCheckout}
              style={{ width:'100%', padding:'12px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'16px' }}>
              Checkout
            </button>
            {message && <p style={{ color:'#4caf50', textAlign:'center', marginTop:'8px' }}>{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
