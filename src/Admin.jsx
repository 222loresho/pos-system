import { useState, useEffect } from 'react';
import api from './api';
import ClearedBills from './ClearedBills';
import UserManagement from './UserManagement';
import DailyReport from './DailyReport';
import LowStock from './LowStock';
import RevenueChart from './RevenueChart';

export default function Admin({ user, onLogout, onSwitchToPOS }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sales, setSales] = useState([]);
  const [message, setMessage] = useState('');
  const [lowStockCount, setLowStockCount] = useState(0);
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category_id: '' });
  const [newCategory, setNewCategory] = useState('');

  const fetchProducts = () => api.get('/products/').then(res => setProducts(res.data));
  const fetchCategories = () => api.get('/categories/').then(res => setCategories(res.data));
  const fetchSales = () => api.get('/sales/').then(res => setSales(res.data));

  useEffect(() => { fetchProducts(); fetchCategories(); fetchSales(); }, []);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) return setMessage('❌ Name and price required!');
    try {
      await api.post('/products/', { ...newProduct, category_id: newProduct.category_id || null });
      fetchProducts();
      setNewProduct({ name: '', price: '', stock: '', category_id: '' });
      setMessage('✅ Product added!');
    } catch (e) { setMessage('❌ ' + (e.response?.data?.error || 'Failed to add product')); }
  };

  const saveEdit = async () => {
    try {
      await api.put(`/products/${editProduct.id}`, editProduct);
      fetchProducts(); setEditProduct(null); setMessage('✅ Product updated!');
    } catch (e) {
      setMessage('❌ ' + (e.response?.data?.error || e.response?.status || 'Failed to update'));
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`); fetchProducts(); setMessage('✅ Deleted!');
    } catch (e) { setMessage('❌ ' + (e.response?.data?.error || 'Failed to delete')); }
  };

  const addCategory = async () => {
    if (!newCategory) return setMessage('❌ Category name required!');
    try {
      await api.post('/categories/', { name: newCategory });
      fetchCategories(); setNewCategory(''); setMessage('✅ Category added!');
    } catch (e) { setMessage('❌ ' + (e.response?.data?.error || 'Failed to add category')); }
  };

  const tabs = [
    { id: 'products', label: '📦 Products' },
    { id: 'categories', label: '🏷️ Categories' },
    { id: 'sales', label: '📊 Sales' },
    { id: 'cleared', label: '✅ Cleared Bills' },
    { id: 'users', label: '👥 Users' },
    { id: 'report', label: '📊 Daily Report' },
    { id: 'lowstock', label: lowStockCount > 0 ? `⚠️ Low Stock (${lowStockCount})` : '⚠️ Low Stock' },
    { id: 'chart', label: '📈 Revenue' },
  ];

  return (
    <div className="page">
      <div className="header">
        <h2>⚙️ Admin Panel</h2>
        <div className="header-right">
          <span className="header-user">👤 {user.name}</span>
          {onSwitchToPOS && (
            <button className="btn btn-success btn-sm" onClick={onSwitchToPOS}>🛒 POS</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : 'inactive'}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {message && <div className={`message ${message.startsWith('❌') ? 'message-error' : 'message-success'}`}>{message}</div>}

      {tab === 'products' && (
        <div>
          <div className="card">
            <div className="section-title">Add Product</div>
            <input className="input" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
            <input className="input" placeholder="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
            <input className="input" placeholder="Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
            <select className="input" value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}>
              <option value="">No Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={addProduct}>Add Product</button>
          </div>

          {editProduct && (
            <div className="card card-dark" style={{ border: '1px solid var(--accent)' }}>
              <div className="section-title">✏️ Edit Product</div>
              <input className="input" placeholder="Name" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
              <input className="input" placeholder="Price" type="number" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} />
              <input className="input" placeholder="Stock" type="number" value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} />
              <select className="input" value={editProduct.category_id || ''} onChange={e => setEditProduct({ ...editProduct, category_id: e.target.value })}>
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="modal-actions">
                <button className="btn btn-success" onClick={saveEdit}>Save</button>
                <button className="btn btn-muted" onClick={() => setEditProduct(null)}>Cancel</button>
              </div>
            </div>
          )}

          {products.map(p => (
            <div key={p.id} className="admin-item">
              <div>
                <div className="admin-item-info">{p.name}</div>
                <div className="admin-item-sub">KSh {p.price} &nbsp;|&nbsp; Stock: {p.stock} &nbsp;|&nbsp; {categories.find(c => c.id === p.category_id)?.name || 'No category'}</div>
              </div>
              <div className="admin-item-actions">
                <button className="btn btn-sm" style={{ background:'var(--card)', color:'white' }} onClick={() => setEditProduct(p)}>✏️</button>
                <button className="btn btn-sm btn-primary" onClick={() => deleteProduct(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <div className="card">
            <div className="section-title">Add Category</div>
            <input className="input" placeholder="Category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
            <button className="btn btn-primary" onClick={addCategory}>Add Category</button>
          </div>
          {categories.map(c => (
            <div key={c.id} className="card">{c.name}</div>
          ))}
        </div>
      )}

      {tab === 'sales' && (
        <div>
          {sales.length === 0 && <p className="text-muted">No sales yet</p>}
          {sales.map(s => (
            <div key={s.id} className="admin-item">
              <div>
                <div className="admin-item-info">#{s.id} — {s.cashier_name}</div>
                <div className="admin-item-sub">
                  Paid: KSh {s.amount_paid} | Change: KSh {s.change_due} | {s.payment_method} | {new Date(s.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-accent text-bold">KSh {s.total}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'cleared' && <ClearedBills />}
      {tab === 'users' && <UserManagement />}
      {tab === 'report' && <DailyReport />}
      {tab === 'lowstock' && <LowStock onCount={setLowStockCount} />}
      {tab === 'chart' && <RevenueChart />}
    </div>
  );
}
