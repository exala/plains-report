import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Feed from './pages/Feed.jsx';
import Saved from './pages/Saved.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Serif+Display&family=IBM+Plex+Sans:wght@300;400;500;600&family=Lora:ital,wght@1,400;1,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { background: #0A0F1A; color: #F0EDE6; font-family: 'IBM Plex Sans', sans-serif; min-height: 100vh; }
  .pr-card { background: #0F1825; border: 1px solid #1A2535; border-radius: 8px; transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
  .pr-card:hover { transform: translateY(-3px); box-shadow: 0 14px 48px rgba(232,119,34,0.13); border-color: rgba(232,119,34,0.3); }
  .pr-filter-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); color: #6A7A8A; padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.09em; cursor: pointer; transition: all 0.15s ease; font-family: 'IBM Plex Sans', sans-serif; white-space: nowrap; }
  .pr-filter-btn:hover { background: rgba(232,119,34,0.12); border-color: rgba(232,119,34,0.35); color: #E87722; }
  .pr-filter-btn.active { background: #E87722; border-color: #E87722; color: #0A0F1A; font-weight: 700; }
  .pr-source-btn { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: #4A5A6A; border: 1px solid #1A2535; padding: 5px 11px; border-radius: 4px; cursor: pointer; transition: all 0.15s ease; background: none; font-family: 'IBM Plex Sans', sans-serif; }
  .pr-source-btn:hover { color: #E87722; border-color: rgba(232,119,34,0.35); background: rgba(232,119,34,0.05); }
  .pr-save-btn { font-size: 17px; color: #2A3A4C; cursor: pointer; transition: color 0.15s ease, transform 0.15s ease; background: none; border: none; line-height: 1; padding: 2px; }
  .pr-save-btn.saved { color: #E87722; }
  .pr-save-btn:hover { color: #E87722; transform: scale(1.2); }
  .score-bar-fill { height: 100%; border-radius: 2px; animation: scoreBarFill 1.5s cubic-bezier(0.4,0,0.2,1) forwards; }
  @keyframes scoreBarFill { from { width: 0%; } to { width: var(--tw); } }
  .pr-trend-dot { width: 8px; height: 8px; background: #0A0F1A; border-radius: 50%; display: inline-block; flex-shrink: 0; animation: trendPulse 1.4s ease-in-out infinite; }
  @keyframes trendPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.7); } }
  .pr-source-drawer { overflow: hidden; transition: max-height 0.38s ease, opacity 0.38s ease; }
  .pr-digest-card { background: linear-gradient(135deg, #03244D 0%, #051B38 100%); border: 1px solid rgba(232,119,34,0.18); border-radius: 10px; margin-bottom: 28px; transition: border-color 0.2s ease; }
  .pr-digest-card:hover { border-color: rgba(232,119,34,0.38); }
  .pr-read-more { color: #E87722; cursor: pointer; background: none; border: none; font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; transition: opacity 0.15s ease; padding: 0; }
  .pr-read-more:hover { opacity: 0.7; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #0A0F1A; }
  ::-webkit-scrollbar-thumb { background: #1A2535; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #E87722; }
  .pr-auth-input { width: 100%; padding: 12px 16px; background: #0F1825; border: 1px solid #1A2535; border-radius: 6px; color: #F0EDE6; font-family: 'IBM Plex Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.15s ease; }
  .pr-auth-input:focus { border-color: #E87722; }
  .pr-auth-btn { width: 100%; padding: 13px; background: #E87722; border: none; border-radius: 6px; color: #0A0F1A; font-family: 'IBM Plex Sans', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.06em; cursor: pointer; transition: opacity 0.15s ease; }
  .pr-auth-btn:hover { opacity: 0.88; }
  .pr-auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const AuthContext = createContext(null);

export function useAuth() { return useContext(AuthContext); }

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plains_user')); } catch { return null; }
  });

  function login(token, userData) {
    localStorage.setItem('plains_token', token);
    localStorage.setItem('plains_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('plains_token');
    localStorage.removeItem('plains_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <style>{GLOBAL_CSS}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
