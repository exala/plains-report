import { useState, useEffect } from 'react';
import api from '../api.js';

export default function TrendAlert() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const res = await api.get('/feed/trend');
        setAlert(res.data);
      } catch {}
    }
    fetchTrend();
    const interval = setInterval(fetchTrend, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!alert) return null;

  return (
    <div style={{ background: '#E87722', padding: '11px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <span className="pr-trend-dot" />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: '#0A0F1A' }}>
        EARL SEES A PATTERN — {alert.theme.toUpperCase()}
      </span>
    </div>
  );
}
