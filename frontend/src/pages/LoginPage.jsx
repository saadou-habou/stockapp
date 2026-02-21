import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/dashboard' : '/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.icon}>📦</div>
          <h1 style={s.title}>StockApp</h1>
          <p style={s.subtitle}>Gestion de stock en temps réel</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.error}>{error}</div>}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={s.input} placeholder="votre@email.com" required />
          </div>

          <div style={s.field}>
            <label style={s.label}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={s.input} placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={s.demo}>
          <p style={s.demoTitle}>Comptes de démonstration</p>
          <div style={s.demoCards}>
            <div style={s.demoCard} onClick={() => { setEmail('admin@stockapp.com'); setPassword('Admin@1234'); }}>
              <strong>👑 Admin</strong><br />
              <small>admin@stockapp.com</small>
            </div>
            <div style={s.demoCard} onClick={() => { setEmail('client@stockapp.com'); setPassword('Client@1234'); }}>
              <strong>👤 Client</strong><br />
              <small>client@stockapp.com</small>
            </div>
          </div>
        </div>

        <div style={s.registerFooter}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={s.registerLink}>Créer un compte</Link>
        </div>

      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', fontFamily: "'Segoe UI', sans-serif" },
  card: { background: 'white', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 25px 50px rgba(0,0,0,0.4)' },
  header: { textAlign: 'center', marginBottom: 32 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: '#1e293b' },
  subtitle: { margin: 0, color: '#64748b', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border .2s' },
  btn: { padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, border: '1px solid #fecaca' },
  demo: { marginTop: 28, borderTop: '1px solid #f1f5f9', paddingTop: 20 },
  demoTitle: { textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  demoCards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  demoCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 10px', textAlign: 'center', cursor: 'pointer', fontSize: 13, color: '#475569', transition: 'all .2s' },
  registerFooter: { textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 14, color: '#64748b' },
  registerLink: { color: '#3b82f6', fontWeight: 600, textDecoration: 'none' },
};
