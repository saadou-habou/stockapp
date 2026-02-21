import { useState, useEffect, useCallback } from 'react';
import { productsAPI, ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Modal = ({ title, onClose, children }) => (
  <div style={s.overlay} onClick={onClose}>
    <div style={s.modal} onClick={e => e.stopPropagation()}>
      <div style={s.modalHeader}>
        <h2 style={s.modalTitle}>{title}</h2>
        <button onClick={onClose} style={s.closeBtn}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// Modal d'achat pour le client
const BuyModal = ({ product, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const total = parseInt(product.price) * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await ordersAPI.create({ product_id: product.id, quantity, client_note: note });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={s.successBox}>
      <div style={{ fontSize: 48 }}>✅</div>
      <h3 style={{ margin: '12px 0 6px', color: '#1e293b' }}>Demande envoyée !</h3>
      <p style={{ color: '#64748b', margin: '0 0 20px' }}>
        Votre demande d'achat pour <strong>{product.name}</strong> est en attente de validation par un administrateur.
      </p>
      <button onClick={onClose} style={s.btnPrimary}>Fermer</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {error && <div style={s.error}>{error}</div>}

      <div style={s.productPreview}>
        <div style={s.previewName}>{product.name}</div>
        <div style={s.previewSku}>{product.sku}</div>
        <div style={s.previewPrice}>{parseInt(product.price).toLocaleString('fr-FR')} FCFA / {product.unit}</div>
        <div style={s.previewStock}>Stock disponible : <strong>{product.quantity}</strong></div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Quantité souhaitée *</label>
        <input type="number" min="1" max={product.quantity} value={quantity}
          onChange={e => setQuantity(Math.max(1, Math.min(product.quantity, parseInt(e.target.value) || 1)))}
          style={s.input} required />
      </div>

      <div style={s.totalBox}>
        <span style={{ color: '#64748b' }}>Total estimé</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
          {total.toLocaleString('fr-FR')} FCFA
        </span>
      </div>

      <div style={s.field}>
        <label style={s.label}>Note pour l'administrateur (optionnel)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          style={{ ...s.input, height: 70, resize: 'vertical' }}
          placeholder="Ex: Commande urgente, livraison avant vendredi..." />
      </div>

      <div style={s.formActions}>
        <button type="button" onClick={onClose} style={s.btnSecondary}>Annuler</button>
        <button type="submit" disabled={loading || product.quantity === 0} style={s.btnBuy}>
          {loading ? 'Envoi...' : '🛒 Envoyer la demande'}
        </button>
      </div>
    </form>
  );
};

const ProductForm = ({ product, onSave, onClose, existingCategories = [] }) => {
  const [form, setForm] = useState(product || { name: '', description: '', sku: '', price: '', quantity: 0, min_quantity: 0, category: '', unit: 'unité' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (product) {
        await productsAPI.update(product.id, form);
      } else {
        await productsAPI.create(form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', required = false) => (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input type={type} value={form[key] || ''} required={required}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        style={s.input} />
    </div>
  );

  const categoryField = () => (
    <div style={s.field}>
      <label style={s.label}>Catégorie</label>
      {newCategory ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            placeholder="Nom de la nouvelle catégorie"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            style={{ ...s.input, flex: 1 }}
            autoFocus
          />
          <button type="button" onClick={() => { setNewCategory(false); setForm({ ...form, category: '' }); }}
            style={s.btnCancel} title="Annuler">✕</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            style={{ ...s.input, flex: 1 }}
          >
            <option value="">— Sélectionner une catégorie —</option>
            {existingCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="button" onClick={() => { setNewCategory(true); setForm({ ...form, category: '' }); }}
            style={s.btnNew} title="Créer une nouvelle catégorie">+ Nouvelle</button>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {error && <div style={s.error}>{error}</div>}
      <div style={s.formGrid}>
        {field('Nom *', 'name', 'text', true)}
        {field('SKU *', 'sku', 'text', true)}
        {field('Prix (FCFA) *', 'price', 'number', true)}
        {!product && field('Quantité initiale', 'quantity', 'number')}
        {field('Stock minimum', 'min_quantity', 'number')}
        {field('Unité', 'unit')}
      </div>
      {categoryField()}
      <div style={s.field}>
        <label style={s.label}>Description</label>
        <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
          style={{ ...s.input, height: 80, resize: 'vertical' }} />
      </div>
      <div style={s.formActions}>
        <button type="button" onClick={onClose} style={s.btnSecondary}>Annuler</button>
        <button type="submit" disabled={loading} style={s.btnPrimary}>
          {loading ? 'Enregistrement...' : product ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [lowStock, setLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { type: 'create'|'edit', product? }
  const [selected, setSelected] = useState(null);
  const [buyProduct, setBuyProduct] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ page, limit: 15, search, category, low_stock: lowStock });
      setProducts(res.data.data);
      setPagination({ page, ...res.data.pagination });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, category, lowStock]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    productsAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Archiver ce produit ?')) return;
    await productsAPI.delete(id);
    load(pagination.page);
  };

  const stockColor = (qty, min) => qty <= 0 ? '#ef4444' : qty <= min ? '#f59e0b' : '#10b981';

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Produits ({pagination.total})</h1>
        {isAdmin && <button onClick={() => setModal({ type: 'create' })} style={s.btnPrimary}>+ Nouveau produit</button>}
      </div>

      {/* Filtres */}
      <div style={s.filters}>
        <input placeholder="🔍 Rechercher (nom, SKU...)" value={search}
          onChange={e => setSearch(e.target.value)} style={{ ...s.input, width: 260 }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={s.input}>
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {isAdmin && (
          <label style={s.checkbox}>
            <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} />
            Stock bas uniquement
          </label>
        )}
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.trHead}>
              {['Produit', 'SKU', 'Prix', 'Stock', ...(isAdmin ? ['Min', 'Catégorie', 'Actions'] : ['Catégorie', 'Actions'])].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={s.loading}>Chargement...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} style={s.empty}>Aucun produit trouvé</td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={s.tr}>
                <td style={s.td}>
                  <div style={s.productName}>{p.name}</div>
                  {p.description && <div style={s.productDesc}>{p.description.slice(0, 60)}...</div>}
                </td>
                <td style={s.td}><code style={s.sku}>{p.sku}</code></td>
                <td style={s.td}>{parseInt(p.price).toLocaleString('fr-FR')} FCFA</td>
                <td style={s.td}>
                  <span style={{ ...s.stockBadge, background: stockColor(p.quantity, p.min_quantity) + '20', color: stockColor(p.quantity, p.min_quantity) }}>
                    {p.quantity} {p.unit}
                  </span>
                </td>
                {isAdmin && <td style={s.td}>{p.min_quantity}</td>}
                <td style={s.td}>{p.category || '—'}</td>
                {isAdmin && (
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button onClick={() => setModal({ type: 'edit', product: p })} style={s.btnEdit}>Modifier</button>
                      <button onClick={() => handleDelete(p.id)} style={s.btnDelete}>Archiver</button>
                    </div>
                  </td>
                )}
                {!isAdmin && (
                  <td style={s.td}>
                    <button
                      onClick={() => setBuyProduct(p)}
                      disabled={p.quantity === 0}
                      style={{ ...s.btnBuy, opacity: p.quantity === 0 ? 0.45 : 1 }}
                    >
                      {p.quantity === 0 ? 'Rupture' : '🛒 Acheter'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={s.pagination}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)}
              style={{ ...s.pageBtn, ...(p === pagination.page ? s.pageBtnActive : {}) }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {buyProduct && (
        <Modal title={`🛒 Commander — ${buyProduct.name}`} onClose={() => setBuyProduct(null)}>
          <BuyModal product={buyProduct} onClose={() => setBuyProduct(null)} />
        </Modal>
      )}

      {modal?.type === 'create' && (
        <Modal title="Nouveau produit" onClose={() => setModal(null)}>
          <ProductForm existingCategories={categories} onSave={() => { setModal(null); load(1); }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title="Modifier le produit" onClose={() => setModal(null)}>
          <ProductForm product={modal.product} existingCategories={categories} onSave={() => { setModal(null); load(pagination.page); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  filters: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  checkbox: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', cursor: 'pointer' },
  tableWrap: { background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  trHead: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background .15s' },
  td: { padding: '12px 16px', fontSize: 14, color: '#374151', verticalAlign: 'middle' },
  productName: { fontWeight: 500, color: '#1e293b' },
  productDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  sku: { background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' },
  stockBadge: { padding: '3px 10px', borderRadius: 12, fontWeight: 600, fontSize: 13 },
  actions: { display: 'flex', gap: 8 },
  loading: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  pagination: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 },
  pageBtn: { padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 14 },
  pageBtnActive: { background: '#3b82f6', color: 'white', borderColor: '#3b82f6' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
  formActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  btnPrimary: { padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnSecondary: { padding: '8px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  btnEdit: { padding: '4px 12px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  btnDelete: { padding: '4px 12px', background: '#fff7f0', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  btnNew: { padding: '8px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
  btnCancel: { padding: '8px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  btnBuy: { padding: '5px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  productPreview: { background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 16 },
  previewName: { fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 4 },
  previewSku: { fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 6 },
  previewPrice: { fontSize: 15, color: '#3b82f6', fontWeight: 600, marginBottom: 4 },
  previewStock: { fontSize: 13, color: '#64748b' },
  totalBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f9ff', borderRadius: 10, padding: '12px 16px', border: '1px solid #bae6fd' },
  successBox: { textAlign: 'center', padding: '20px 10px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13 },
};
