import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Field = ({ label, name, type = 'text', placeholder, value, onChange, error }) => (
  <div style={s.field}>
    <label style={s.label}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...s.input, ...(error ? s.inputError : {}) }}
      autoComplete={type === 'password' ? 'new-password' : undefined}
    />
    {error && <span style={s.fieldError}>{error}</span>}
  </div>
);

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Prénom requis';
    if (!form.last_name.trim()) e.last_name = 'Nom requis';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalide';
    if (form.password.length < 8) e.password = '8 caractères minimum';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Doit contenir majuscule, minuscule et chiffre';
    if (form.password !== form.confirm_password) e.confirm_password = 'Les mots de passe ne correspondent pas';
    return e;
  };

  const handleChange = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      await authAPI.register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email,
        password: form.password,
        role: 'client',
      });
      await login(form.email, form.password);
      navigate('/products');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.header}>
          <div style={s.icon}>📦</div>
          <h1 style={s.title}>Créer un compte</h1>
          <p style={s.subtitle}>Rejoignez StockApp en quelques secondes</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form} noValidate>
          {serverError && <div style={s.serverError}>{serverError}</div>}

          <div style={s.row}>
            <Field label="Prénom *" name="first_name" placeholder="Moussa"
              value={form.first_name} onChange={handleChange('first_name')} error={errors.first_name} />
            <Field label="Nom *" name="last_name" placeholder="Ibrahim"
              value={form.last_name} onChange={handleChange('last_name')} error={errors.last_name} />
          </div>

          <Field label="Email *" name="email" type="email" placeholder="moussa.ibrahim@email.com"
            value={form.email} onChange={handleChange('email')} error={errors.email} />
          <Field label="Mot de passe *" name="password" type="password" placeholder="Min. 8 caractères"
            value={form.password} onChange={handleChange('password')} error={errors.password} />
          <Field label="Confirmer le mot de passe *" name="confirm_password" type="password" placeholder="Répétez le mot de passe"
            value={form.confirm_password} onChange={handleChange('confirm_password')} error={errors.confirm_password} />

          <div style={s.hint}>
            Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
          </div>

          <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>

        <div style={s.footer}>
          Vous avez déjà un compte ?{' '}
          <Link to="/login" style={s.link}>Se connecter</Link>
        </div>

      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', fontFamily: "'Segoe UI', sans-serif", padding: '24px 16px' },
  card: { background: 'white', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 460, boxShadow: '0 25px 50px rgba(0,0,0,0.4)' },
  header: { textAlign: 'center', marginBottom: 28 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#1e293b' },
  subtitle: { margin: 0, color: '#64748b', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border .2s', color: '#1e293b' },
  inputError: { borderColor: '#ef4444', background: '#fff8f8' },
  fieldError: { fontSize: 12, color: '#ef4444', marginTop: 2 },
  serverError: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, border: '1px solid #fecaca' },
  hint: { fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '9px 12px', borderRadius: 8, lineHeight: 1.5 },
  btn: { padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  footer: { textAlign: 'center', marginTop: 22, fontSize: 14, color: '#64748b' },
  link: { color: '#3b82f6', fontWeight: 600, textDecoration: 'none' },
};
