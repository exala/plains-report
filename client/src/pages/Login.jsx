import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: '#F0EDE6', margin: 0 }}>
            The Plains Report
          </h1>
          <p style={{ color: '#4A5A6A', fontSize: 13, marginTop: 8 }}>Sign in to save stories and access your feed</p>
        </div>

        <div style={{ background: '#0F1825', border: '1px solid #1A2535', borderRadius: 10, padding: 32 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F0EDE6', margin: '0 0 24px 0' }}>Sign in</h2>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#FC8181' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#5A6A7A', marginBottom: 8 }}>EMAIL</label>
              <input className="pr-auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#5A6A7A', marginBottom: 8 }}>PASSWORD</label>
              <input className="pr-auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button className="pr-auth-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#4A5A6A', marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#E87722', textDecoration: 'none', fontWeight: 600 }}>Register</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#4A5A6A', marginTop: 8 }}>
            <Link to="/feed" style={{ color: '#5A6A7A', textDecoration: 'none' }}>← Back to feed</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
