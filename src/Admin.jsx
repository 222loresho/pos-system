import { useState, useEffect } from 'react';
import api from './api';

export default function Admin({ user, onLogout }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sales, setSales] = useState([]);
  const [message, setMessage] = useState('');
  const [editProduct, setEditProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category_id: '' });
  const [newCategory, setNewCategory] = useState('');

  const fetchProducts = () => api.get('/products/').then(res => setProducts(res.data));
  const fetchCategories = () => api.get('/categories/').then(res => setCategories(res.data));
  const fetchSales = () => api.get('/sales/').then(res => setSales(res.data));

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSales();
  }, []);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) return setMessage('Name and price required!');
    await api.post('/products/', newProduct);
    fetchProducts();
    setNewProduct({ name: '', price: '', stock: '', category_id: '' });
    setMessage('✅ Product added!');
  };

  const saveEdit = async () => {
    await api.put(`/products/${editProduct.id}`, editProduct);
    fetchProducts();
    setEditProduct(null);
    setMessage('✅ Product updated!');
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
    setMessage('✅ Product deleted!');
  };

  const addCategory = async () => {
    if (!newCategory) return setMessage('Category name required!');
    await api.post('/categories/', { name: newCategory });
    fetchCategories();
    setNewCategory('');
    setMessage('✅ Category added!');
  };

  const btnStyle = (active) => ({
    padding: '10px 20px',
    background: active ? '#e94560' : '#16213e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '8px'
  });

  const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: 'none',
    marginBottom: '8px',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ background: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: '#e94560', margin: 0 }}>⚙️ Admin Panel</h2>
        <div>
          <span style={{ marginRight: '12px' }}>👤 {user.name}</span>
          <button onClick={onLogout} style={{ padding: '6px 12px', background: '#e94560', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button style={btnStyle(tab === 'products')} onClick={() => setTab('products')}>📦 Products</button>
        <button style={btnStyle(tab === 'categories')} onClick={() => setTab('categories')}>🏷️ Categories</button>
        <button style={btnStyle(tab === 'sales')} onClick={() => setTab('sales')}>📊 Sales</button>
      </div>

      {message && <p style={{ color: '#4caf50' }}>{message}</p>}

      {tab === 'products' && (
        <div>
          {/* Add Product Form */}
          <div style={{ background: '#16213e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h3 style={{ color: '#e94560', marginTop: 0 }}>Add Product</h3>
            <input placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={inputStyle} />
            <input placeholder="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={inputStyle} />
            <input placeholder="Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} style={inputStyle} />
            <select value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })} style={inputStyle}>
              <option value="">No Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={addProduct} style={{ width: '100%', padding: '10px', background: '#e94560', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add Product</button>
          </div>

          {/* Edit Modal */}
          {editProduct && (
            <div style={{ background: '#0f3460', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e94560' }}>
              <h3 style={{ color: '#e94560', marginTop: 0 }}>✏️ Edit Product</h3>
              <input placeholder="Name" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} style={inputStyle} />
              <input placeholder="Price" type="number" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} style={inputStyle} />
              <input placeholder="Stock" type="number" value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} style={inputStyle} />
              <select value={editProduct.category_id || ''} onChange={e => setEditProduct({ ...editProduct, category_id: e.target.value })} style={inputStyle}>
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveEdit} style={{ flex: 1, padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditProduct(null)} style={{ flex: 1, padding: '10px', background: '#888', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Products List */}
          {products.map(p => (
            <div key={p.id} style={{ background: '#16213e', padding: '12px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{p.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#e94560' }}>KSh {p.price} | Stock: {p.stock}</span>
                <button onClick={() => setEditProduct(p)} style={{ padding: '4px 10px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => deleteProduct(p.id)} style={{ padding: '4px 10px', background: '#e94560', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <div style={{ background: '#16213e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h3 style={{ color: '#e94560', marginTop: 0 }}>Add Category</h3>
            <input placeholder="Category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={inputStyle} />
            <button onClick={addCategory} style={{ width: '100%', padding: '10px', background: '#e94560', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add Category</button>
          </div>
          {categories.map(c => (
            <div key={c.id} style={{ background: '#16213e', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
              {c.name}
            </div>
          ))}
        </div>
      )}

      {tab === 'sales' && (
        <div>
          {sales.length === 0 && <p style={{ color: '#888' }}>No sales yet</p>}
          {sales.map(s => (
            <div key={s.id} style={{ background: '#16213e', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>#{s.id} — {s.cashier_name}</span>
                <span style={{ color: '#e94560' }}>KSh {s.total}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Paid: KSh {s.amount_paid} | Change: KSh {s.change_due} | {s.payment_method} | {new Date(s.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
