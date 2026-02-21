import { useState, useEffect } from 'react';
import { stockAPI } from '../services/api';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...s.card, borderLeft: `4px solid ${color}` }}>
    <div style={s.cardIcon}>{icon}</div>
    <div>
      <div style={s.cardValue}>{value}</div>
      <div style={s.cardLabel}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>Chargement du tableau de bord...</div>;
  if (!data) return <div>Erreur de chargement</div>;

  const { stats, low_stock_alerts, recent_entries, recent_exits } = data;

  return (
    <div>
      <h1 style={s.title}>Tableau de bord</h1>

      <div style={s.statsGrid}>
        <StatCard icon="📦" label="Produits actifs" value={stats.total_products} color="#3b82f6" />
        <StatCard icon="🔢" label="Unités en stock" value={parseInt(stats.total_units || 0).toLocaleString()} color="#10b981" />
        <StatCard icon="💰" label="Valeur du stock" value={`${parseFloat(stats.stock_value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`} color="#f59e0b" />
        <StatCard icon="⚠️" label="Alertes stock bas" value={low_stock_alerts.length} color="#ef4444" />
      </div>

      <div style={s.panels}>
        {/* Alertes stock bas */}
        {low_stock_alerts.length > 0 && (
          <div style={s.panel}>
            <h2 style={s.panelTitle}>⚠️ Alertes Stock Bas</h2>
            <table style={s.table}>
              <thead>
                <tr>{['Produit', 'SKU', 'Stock', 'Minimum'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {low_stock_alerts.map(p => (
                  <tr key={p.id} style={s.trAlert}>
                    <td style={s.td}>{p.name}</td>
                    <td style={s.td}><code>{p.sku}</code></td>
                    <td style={{ ...s.td, color: '#ef4444', fontWeight: 700 }}>{p.quantity}</td>
                    <td style={s.td}>{p.min_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={s.twoCol}>
          {/* Dernières entrées */}
          <div style={s.panel}>
            <h2 style={s.panelTitle}>📥 Dernières entrées</h2>
            {recent_entries.map((e, i) => (
              <div key={i} style={s.histItem}>
                <div>
                  <div style={s.histProduct}>{e.product_name}</div>
                  <div style={s.histMeta}>{e.reason}</div>
                </div>
                <span style={{ ...s.histQty, color: '#10b981' }}>+{e.quantity}</span>
              </div>
            ))}
          </div>

          {/* Dernières sorties */}
          <div style={s.panel}>
            <h2 style={s.panelTitle}>📤 Dernières sorties</h2>
            {recent_exits.map((e, i) => (
              <div key={i} style={s.histItem}>
                <div>
                  <div style={s.histProduct}>{e.product_name}</div>
                  <div style={s.histMeta}>{e.reason}</div>
                </div>
                <span style={{ ...s.histQty, color: '#ef4444' }}>-{e.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: 'white', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  cardIcon: { fontSize: 32 },
  cardValue: { fontSize: 28, fontWeight: 700, color: '#1e293b' },
  cardLabel: { fontSize: 13, color: '#64748b', marginTop: 2 },
  panels: { display: 'flex', flexDirection: 'column', gap: 16 },
  panel: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f8fafc' },
  trAlert: { background: '#fff7f7' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  histItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  histProduct: { fontWeight: 500, color: '#1e293b', fontSize: 14 },
  histMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  histQty: { fontWeight: 700, fontSize: 18 },
};
