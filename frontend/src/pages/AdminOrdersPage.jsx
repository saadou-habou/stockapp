import { useState, useEffect, useCallback } from 'react';
import { ordersAPI } from '../services/api';

const STATUS = {
  pending:  { label: 'En attente',  color: '#f59e0b', bg: '#fefce8', icon: '⏳' },
  approved: { label: 'Approuvée',   color: '#10b981', bg: '#f0fdf4', icon: '✅' },
  rejected: { label: 'Refusée',     color: '#ef4444', bg: '#fef2f2', icon: '❌' },
};

const ActionModal = ({ order, action, onConfirm, onClose }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const isApprove = action === 'approve';

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(note);
    setLoading(false);
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h2 style={s.modalTitle}>
          {isApprove ? '✅ Approuver la commande' : '❌ Refuser la commande'}
        </h2>
        <div style={s.orderSummary}>
          <div style={s.summaryRow}><span>Client</span><strong>{order.client_name}</strong></div>
          <div style={s.summaryRow}><span>Produit</span><strong>{order.product_name}</strong></div>
          <div style={s.summaryRow}><span>Quantité</span><strong>{order.quantity}</strong></div>
          <div style={s.summaryRow}><span>Total</span><strong>{parseInt(order.total_price).toLocaleString('fr-FR')} FCFA</strong></div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Note pour le client (optionnel)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            style={{ ...s.input, height: 80, resize: 'vertical' }}
            placeholder={isApprove ? 'Ex: Votre commande sera livrée demain.' : 'Ex: Stock réservé pour une commande prioritaire.'} />
        </div>
        <div style={s.modalActions}>
          <button onClick={onClose} style={s.btnSecondary}>Annuler</button>
          <button onClick={handleConfirm} disabled={loading}
            style={{ ...s.btnAction, background: isApprove ? '#10b981' : '#ef4444' }}>
            {loading ? 'Traitement...' : isApprove ? '✅ Confirmer l\'approbation' : '❌ Confirmer le refus'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { order, action }
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        ordersAPI.getAll({ status: statusFilter }),
        ordersAPI.getStats()
      ]);
      setOrders(ordersRes.data.data);
      setStats(statsRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (note) => {
    const { order, action } = modal;
    try {
      const fn = action === 'approve' ? ordersAPI.approve : ordersAPI.reject;
      const res = await fn(order.id, { admin_note: note });
      showToast(res.data.message, true);
      setModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur', false);
      setModal(null);
    }
  };

  const fmtDate = d => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const fmtPrice = n => parseInt(n).toLocaleString('fr-FR') + ' FCFA';

  return (
    <div>
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? '#10b981' : '#ef4444' }}>{toast.msg}</div>
      )}

      <h1 style={s.title}>Demandes d'achat</h1>

      {/* Stats */}
      <div style={s.statsRow}>
        {[['pending', '⏳', 'En attente'], ['approved', '✅', 'Approuvées'], ['rejected', '❌', 'Refusées']].map(([key, icon, label]) => (
          <div key={key} style={{ ...s.statCard, ...(statusFilter === key ? { borderColor: STATUS[key].color, boxShadow: `0 0 0 2px ${STATUS[key].color}30` } : {}) }}
            onClick={() => setStatusFilter(key)}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <div>
              <div style={{ ...s.statCount, color: STATUS[key].color }}>{stats[key]}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.trHead}>
              {['Date', 'Client', 'Produit', 'Qté', 'Total', 'Statut', ...(statusFilter === 'pending' ? ['Actions'] : ['Traité le'])].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={s.center}>Chargement...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={s.center}>Aucune demande {STATUS[statusFilter]?.label.toLowerCase()}</td></tr>
            ) : orders.map(o => {
              const st = STATUS[o.status];
              return (
                <tr key={o.id} style={s.tr}>
                  <td style={s.td}>{fmtDate(o.created_at)}</td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 500 }}>{o.client_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.client_email}</div>
                  </td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 500 }}>{o.product_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{o.sku}</div>
                  </td>
                  <td style={s.td}>{o.quantity}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{fmtPrice(o.total_price)}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, color: st.color, background: st.bg }}>
                      {st.icon} {st.label}
                    </span>
                  </td>
                  {statusFilter === 'pending' ? (
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button onClick={() => setModal({ order: o, action: 'approve' })} style={s.btnApprove}>✅ Approuver</button>
                        <button onClick={() => setModal({ order: o, action: 'reject' })} style={s.btnReject}>❌ Refuser</button>
                      </div>
                    </td>
                  ) : (
                    <td style={s.td}>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{o.reviewed_at ? fmtDate(o.reviewed_at) : '—'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.reviewed_by_name}</div>
                      {o.admin_note && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontStyle: 'italic' }}>"{o.admin_note}"</div>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <ActionModal
          order={modal.order}
          action={modal.action}
          onConfirm={handleAction}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const s = {
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 20 },
  toast: { position: 'fixed', top: 20, right: 20, color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,.2)' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: 'white', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,.08)', cursor: 'pointer', border: '2px solid transparent', transition: 'all .2s' },
  statCount: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tableWrap: { background: 'white', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 750 },
  trHead: { background: '#f8fafc' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '12px 14px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  badge: { padding: '3px 10px', borderRadius: 20, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' },
  center: { textAlign: 'center', padding: 40, color: '#94a3b8' },
  actions: { display: 'flex', gap: 7 },
  btnApprove: { padding: '5px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnReject: { padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 },
  modalTitle: { margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: '#1e293b' },
  orderSummary: { background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 8 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 },
  btnSecondary: { padding: '9px 18px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  btnAction: { padding: '9px 18px', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};
