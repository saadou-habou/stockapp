import { useState, useEffect, useCallback } from 'react';
import { stockAPI, productsAPI, suppliersAPI } from '../services/api';

const SupplierSelect = ({ value, onChange, suppliers, styles: s }) => {
  const [isNew, setIsNew] = useState(false);

  const switchToNew = () => { setIsNew(true); onChange(''); };
  const switchToList = () => { setIsNew(false); onChange(''); };

  if (isNew) return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Nom du nouveau fournisseur"
        style={{ ...s.input, flex: 1 }}
        autoFocus
      />
      <button type="button" onClick={switchToList}
        style={{ padding: '8px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
        ✕
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s.input, flex: 1 }}>
        <option value="">— Sélectionner un fournisseur —</option>
        {suppliers.map(sup => (
          <option key={sup.id} value={sup.name}>{sup.name}</option>
        ))}
      </select>
      <button type="button" onClick={switchToNew}
        style={{ padding: '8px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
        + Nouveau
      </button>
    </div>
  );
};

const EntryExitForm = ({ type, onSave, onClose }) => {
  const [form, setForm] = useState({ product_id: '', quantity: 1, reason: type === 'entry' ? 'Approvisionnement' : 'Vente', supplier: '', client_name: '', unit_price: '' });
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    productsAPI.getAll({ limit: 100 }).then(r => setProducts(r.data.data));
    if (type === 'entry') {
      suppliersAPI.getAll().then(r => setSuppliers(r.data.data));
    }
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (type === 'entry') {
        await stockAPI.createEntry(form);
      } else {
        await stockAPI.createExit(form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const isEntry = type === 'entry';
  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {error && <div style={s.error}>{error}</div>}

      <div style={s.field}>
        <label style={s.label}>Produit *</label>
        <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} style={s.input} required>
          <option value="">Sélectionner un produit...</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity})</option>)}
        </select>
      </div>

      <div style={s.formRow}>
        <div style={s.field}>
          <label style={s.label}>Quantité *</label>
          <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} style={s.input} required />
        </div>
        {isEntry && (
          <div style={s.field}>
            <label style={s.label}>Prix unitaire (FCFA)</label>
            <input type="number" min="0" step="1" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} style={s.input} placeholder="0" />
          </div>
        )}
      </div>

      <div style={s.formRow}>
        <div style={s.field}>
          <label style={s.label}>{isEntry ? 'Fournisseur' : 'Client'}</label>
          {isEntry ? (
            <SupplierSelect
              value={form.supplier}
              onChange={val => setForm({ ...form, supplier: val })}
              suppliers={suppliers}
              styles={s}
            />
          ) : (
            <input
              value={form.client_name}
              onChange={e => setForm({ ...form, client_name: e.target.value })}
              style={s.input}
              placeholder="Nom du client"
            />
          )}
        </div>
        <div style={s.field}>
          <label style={s.label}>Motif</label>
          <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={s.input} />
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Référence document</label>
        <input value={form.reference_doc} onChange={e => setForm({ ...form, reference_doc: e.target.value })} style={s.input} placeholder="BL-2024-001..." />
      </div>

      <div style={s.formActions}>
        <button type="button" onClick={onClose} style={s.btnSecondary}>Annuler</button>
        <button type="submit" disabled={loading} style={{ ...s.btnPrimary, background: isEntry ? '#10b981' : '#ef4444' }}>
          {loading ? 'Enregistrement...' : isEntry ? '📥 Enregistrer entrée' : '📤 Enregistrer sortie'}
        </button>
      </div>
    </form>
  );
};

export default function StockPage() {
  const [tab, setTab] = useState('entries');
  const [entries, setEntries] = useState([]);
  const [exits, setExits] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    const res = await stockAPI.getEntries({ limit: 30 });
    setEntries(res.data.data);
  }, []);

  const loadExits = useCallback(async () => {
    const res = await stockAPI.getExits({ limit: 30 });
    setExits(res.data.data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEntries(), loadExits()]).finally(() => setLoading(false));
  }, [loadEntries, loadExits]);

  const fmtDate = (d) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  const renderTable = (data, type) => (
    <table style={s.table}>
      <thead>
        <tr style={s.trHead}>
          {['Date', 'Produit', 'Qté', type === 'entry' ? 'Fournisseur' : 'Client', 'Motif', 'Avant', 'Après', 'Par'].map(h => (
            <th key={h} style={s.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={8} style={s.center}>Chargement...</td></tr>
        ) : data.length === 0 ? (
          <tr><td colSpan={8} style={s.center}>Aucun mouvement enregistré</td></tr>
        ) : data.map(r => (
          <tr key={r.id} style={s.tr}>
            <td style={s.td}>{fmtDate(r.created_at)}</td>
            <td style={s.td}><div style={s.productName}>{r.product_name}</div><small style={s.sku}>{r.sku}</small></td>
            <td style={s.td}>
              <span style={{ color: type === 'entry' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                {type === 'entry' ? '+' : '-'}{r.quantity}
              </span>
            </td>
            <td style={s.td}>{type === 'entry' ? (r.supplier || '—') : (r.client_name || '—')}</td>
            <td style={s.td}>{r.reason}</td>
            <td style={s.td}>{r.quantity_before}</td>
            <td style={s.td}>{r.quantity_after}</td>
            <td style={s.td}>{r.created_by_name || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Mouvements de stock</h1>
        <div style={s.headerActions}>
          <button onClick={() => setModal('entry')} style={{ ...s.btnAction, background: '#10b981' }}>📥 Nouvelle entrée</button>
          <button onClick={() => setModal('exit')} style={{ ...s.btnAction, background: '#ef4444' }}>📤 Nouvelle sortie</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[['entries', '📥 Entrées', entries.length], ['exits', '📤 Sorties', exits.length]].map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}>
            {label} <span style={s.tabCount}>{count}</span>
          </button>
        ))}
      </div>

      <div style={s.tableWrap}>
        {tab === 'entries' ? renderTable(entries, 'entry') : renderTable(exits, 'exit')}
      </div>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {modal === 'entry' ? '📥 Nouvelle entrée de stock' : '📤 Nouvelle sortie de stock'}
              </h2>
              <button onClick={() => setModal(null)} style={s.closeBtn}>✕</button>
            </div>
            <EntryExitForm type={modal} onClose={() => setModal(null)} onSave={() => {
              setModal(null);
              loadEntries();
              loadExits();
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  headerActions: { display: 'flex', gap: 10 },
  btnAction: { padding: '8px 18px', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  tabs: { display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 10, marginBottom: 16, width: 'fit-content' },
  tab: { padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 },
  tabActive: { background: 'white', color: '#1e293b', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,.1)' },
  tabCount: { background: '#e2e8f0', padding: '1px 8px', borderRadius: 10, fontSize: 12 },
  tableWrap: { background: 'white', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 800 },
  trHead: { background: '#f8fafc' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '11px 14px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  productName: { fontWeight: 500, color: '#1e293b' },
  sku: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
  center: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '95vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
  formActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  btnPrimary: { padding: '9px 20px', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnSecondary: { padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13 },
};
