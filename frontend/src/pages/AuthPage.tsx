import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card appear">
        <div className="auth-logo">
          <div className="auth-logo-mark" />
          SmartWallets <span className="accent">AI</span>
        </div>

        <h2 style={{ marginBottom: 6 }}>
          {mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
        </h2>
        <p className="text-3 text-sm" style={{ marginBottom: 24 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {error && <div className="auth-error mb-16">{error}</div>}

        <form className="col" style={{ gap: 14 }} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-group">
              <label className="label">ชื่อ · Name</label>
              <input className="input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="input-group">
            <label className="label">อีเมล · Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="label">รหัสผ่าน · Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 8, justifyContent: 'center' }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : mode === 'login' ? 'เข้าสู่ระบบ · Sign In' : 'สร้างบัญชี · Register'}
          </button>
        </form>

        <div className="text-sm text-3" style={{ textAlign: 'center', marginTop: 20 }}>
          {mode === 'login' ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีแล้ว? '}
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', padding: '2px 6px' }}
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'สร้างบัญชี · Register' : 'เข้าสู่ระบบ · Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
