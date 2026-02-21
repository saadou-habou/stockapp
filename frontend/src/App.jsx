import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import StockPage from './pages/StockPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminOrdersPage from './pages/AdminOrdersPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/products" replace />;
  return children;
};

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const navLink = (to, label) => (
    <Link to={to} style={{
      ...styles.navLink,
      ...(location.pathname.startsWith(to) ? styles.navLinkActive : {})
    }}>{label}</Link>
  );

  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>📦 StockApp</div>
      <div style={styles.navLinks}>
        {isAdmin && navLink('/dashboard', 'Tableau de bord')}
        {navLink('/products', 'Produits')}
        {isAdmin && navLink('/stock', 'Mouvements de stock')}
        {isAdmin && navLink('/admin/orders', 'Commandes')}
        {!isAdmin && navLink('/my-orders', 'Mes commandes')}
      </div>
      <div style={styles.navUser}>
        <span style={styles.userInfo}>
          {user?.first_name} {user?.last_name}
          <span style={{ ...styles.badge, background: isAdmin ? '#3b82f6' : '#10b981' }}>
            {user?.role}
          </span>
        </span>
        <button onClick={logout} style={styles.logoutBtn}>Déconnexion</button>
      </div>
    </nav>
  );
};

const Layout = ({ children }) => (
  <div style={styles.app}>
    <Navbar />
    <main style={styles.main}>{children}</main>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute adminOnly>
              <Layout><DashboardPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Layout><ProductsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/stock" element={
            <ProtectedRoute adminOnly>
              <Layout><StockPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminOrdersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <Layout><MyOrdersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', sans-serif" },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18 },
  nav: { background: '#1e293b', color: 'white', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 24, height: 60, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
  navBrand: { fontWeight: 700, fontSize: 20, marginRight: 16 },
  navLinks: { display: 'flex', gap: 8, flex: 1 },
  navLink: { color: '#94a3b8', textDecoration: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 14, transition: 'all .2s' },
  navLinkActive: { color: 'white', background: '#334155' },
  navUser: { display: 'flex', alignItems: 'center', gap: 12 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#e2e8f0' },
  badge: { padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: 'white', textTransform: 'uppercase' },
  logoutBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  main: { padding: 24, maxWidth: 1280, margin: '0 auto' },
};
