import { useAuth } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

export default function Masthead() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/feed'); }

  return (
    <div style={{ background: 'linear-gradient(180deg, #060B16 0%, #0A0F1A 100%)' }}>
      <div style={{ textAlign: 'center', padding: '40px 24px 22px' }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.3em', color: '#2A3A4C', marginBottom: 14, textTransform: 'uppercase' }}>
          Auburn · Football · Intelligence
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(38px, 6.5vw, 68px)', fontWeight: 900, color: '#F0EDE6', letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
          The Plains Report
        </h1>
        <div style={{ fontSize: 12, color: '#3A4A5C', marginTop: 11, letterSpacing: '0.1em' }}>
          Delivered by <span style={{ color: '#E87722', fontWeight: 700 }}>Easy Earl</span> — the smartest guy at the tailgate
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14 }}>
          {user ? (
            <>
              <span style={{ fontSize: 11, color: '#4A5A6A' }}>
                <span onClick={() => navigate('/saved')} style={{ color: '#E87722', cursor: 'pointer', fontWeight: 600 }}>Saved</span>
                {' · '}{user.username}
              </span>
              <button onClick={handleLogout} style={{ fontSize: 11, color: '#4A5A6A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{ fontSize: 11, color: '#E87722', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Sign in</button>
              <button onClick={() => navigate('/register')} style={{ fontSize: 11, color: '#4A5A6A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Register</button>
            </>
          )}
        </div>
      </div>
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, #E87722 25%, #E87722 75%, transparent 100%)' }} />
    </div>
  );
}
