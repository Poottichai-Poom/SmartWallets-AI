import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="appbar">
      <Link to="/dashboard" className="brand">
        <div className="brand-mark" />
        SmartWallets <span>AI</span>
      </Link>

      <span className="text-xs text-3" style={{ marginLeft: 4, paddingLeft: 14, borderLeft: '1px solid var(--border)' }}>
        ผู้ช่วยการเงินส่วนตัวอัจฉริยะ · <span className="text-3">Smart Finance AI</span>
      </span>

      <nav className="row" style={{ gap: 4, marginLeft: 'auto' }}>
        <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
        <Link to="/upload" className="btn btn-ghost btn-sm">Upload PDF</Link>
      </nav>

      <div className="row" style={{ gap: 10, marginLeft: 8 }}>
        <span className="text-xs text-3">{user?.email}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
