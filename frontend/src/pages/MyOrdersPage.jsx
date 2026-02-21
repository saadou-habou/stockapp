import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';

const STATUS = {
  pending:  { label: 'En attente',  color: '#f59e0b', bg: '#fefce8', icon: '⏳' },
  approved: { label: 'Approuvée',   color: '#10b981', bg: '#f0fdf4', icon: '✅' },
  rejected: { label: 'Refusée',     color: '#ef4444', bg: '#fef2f2', icon: '❌' },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getMy()
      .then(r => setOrders(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = d => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const fmtPrice = n => parseInt(n).toLocaleString('fr-FR') + ' FCFA';

  if (loading) return <div style={s.center}>Chargement...</div>;

  return (
    <div>
      <h1 style={s.title}>Mes demandes d'achat</h1>

      {orders.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <div style={{ fontSize: 16, color: '#64748b' }}>Vous n'avez encore passé aucune commande.</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Rendez-vous dans le catalogue pour commander.</div>
        </div>
      ) : (
        <div style={s.list}>
          {orders.map(o => {
            const st = STATUS[o.status];
            return (
              <div key={o.id} style={s.card}>
                <div style={s.cardHeader}>
                  <div>
                    <div style={s.productName}>{o.product_name}</div>
                    <div style={s.sku}>{o.sku}</div>
                  </div>
                  <span style={{ ...s.badge, color: st.color, background: st.bg }}>
                    {st.icon} {st.label}
                  </span>
                </div>

                <div style={s.cardBody}>
                  <div style={s.detail}>
                    <span style={s.detailLabel}>Quantité</span>
                    <span style={s.detailValue}>{o.quantity}</span>
                  </div>
                  <div style={s.detail}>
                    <span style={s.detailLabel}>Prix unitaire</span>
                    <span style={s.detailValue}>{fmtPrice(o.unit_price)}</span>
                  </div>
                  <div style={s.detail}>
                    <span style={s.detailLabel}>Total</span>
                    <span style={{ ...s.detailValue, fontWeight: 700, color: '#1e293b' }}>{fmtPrice(o.total_price)}</span>
                  </div>
                  <div style={s.detail}>
                    <span style={s.detailLabel}>Date</span>
                    <span style={s.detailValue}>{fmtDate(o.created_at)}</span>
                  </div>
                </div>

                {o.client_note && (
                  <div style={s.note}>
                    <span style={s.noteLabel}>Votre note :</span> {o.client_note}
                  </div>
                )}
                {o.admin_note && (
                  <div style={{ ...s.note, background: o.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderColor: st.color + '40' }}>
                    <span style={{ ...s.noteLabel, color: st.color }}>Réponse admin :</span> {o.admin_note}
                  </div>
                )}
                {o.reviewed_at && (
                  <div style={s.reviewedAt}>
                    Traitée le {fmtDate(o.reviewed_at)} par {o.reviewed_by_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  center: { textAlign: 'center', padding: 60, color: '#94a3b8' },
  empty: { textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: 'white', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  productName: { fontWeight: 700, fontSize: 16, color: '#1e293b' },
  sku: { fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginTop: 3 },
  badge: { padding: '4px 12px', borderRadius: 20, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' },
  cardBody: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '14px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' },
  detail: { display: 'flex', flexDirection: 'column', gap: 3 },
  detailLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 },
  detailValue: { fontSize: 14, color: '#475569' },
  note: { marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569', border: '1px solid #e2e8f0' },
  noteLabel: { fontWeight: 600, color: '#64748b' },
  reviewedAt: { marginTop: 8, fontSize: 11, color: '#94a3b8', textAlign: 'right' },
};
