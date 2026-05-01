import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      navigate('/feed');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('That email or username is already in use. Try signing in instead.');
      else setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          <p style={{ color: '#4A5A6A', fontSize: 13, marginTop: 8 }}>Join Easy Earl's corner of the internet</p>
        </div>

        <div style={{ background: '#0F1825', border: '1px solid #1A2535', borderRadius: 10, padding: 32 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F0EDE6', margin: '0 0 24px 0' }}>Create account</h2>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#FC8181' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#5A6A7A', marginBottom: 8 }}>USERNAME</label>
              <input className="pr-auth-input" name="username" value={form.username} onChange={handleChange} required placeholder="WarEagleFan" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#5A6A7A', marginBottom: 8 }}>EMAIL</label>
              <input className="pr-auth-input" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#5A6A7A', marginBottom: 8 }}>PASSWORD</label>
              <input className="pr-auth-input" type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Min 8 characters" />
            </div>
            <button className="pr-auth-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#4A5A6A', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#E87722', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#4A5A6A', marginTop: 8 }}>
            <Link to="/feed" style={{ color: '#5A6A7A', textDecoration: 'none' }}>← Back to feed</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
