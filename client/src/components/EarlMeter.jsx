import { useState, useEffect } from 'react';
import api from '../api.js';

const MOOD_CONFIG = {
  'UNHINGED':              { color: '#E87722', emoji: '🔥', arrow: '↑' },
  'CAUTIOUSLY OPTIMISTIC': { color: '#C4973A', emoji: '📊', arrow: '↑' },
  'CONCERNED':             { color: '#EF4444', emoji: '😬', arrow: '↓' },
  'WATCHFUL':              { color: '#4A5A6A', emoji: '👁', arrow: '—' },
};

const MOOD_LINES = {
  'UNHINGED':              "Earl is seeing things that are making him emotional. The numbers are up. He has a new spreadsheet.",
  'CAUTIOUSLY OPTIMISTIC': "Earl has reviewed the data. Things are trending in the right direction. He is being careful about getting too excited.",
  'CONCERNED':             "Earl has some concerns. He made a chart. The chart is on the refrigerator. His wife has not asked about it yet.",
  'WATCHFUL':              "Earl is watching. Quietly. He has the film queued up. He will have more to say shortly.",
};

export default function EarlMeter() {
  const [pulse, setPulse] = useState(null);

  useEffect(() => {
    api.get('/feed/pulse').then(res => setPulse(res.data)).catch(() => {});
  }, []);

  if (!pulse) return null;

  const config = MOOD_CONFIG[pulse.earl_mood] || MOOD_CONFIG['WATCHFUL'];
  const deltaStr = pulse.delta > 0 ? `+${pulse.delta}` : `${pulse.delta}`;

  return (
    <div style={{ background: 'rgba(15,24,37,0.8)', borderBottom: '1px solid #111B28', padding: '10px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{config.emoji}</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#2A3A4C' }}>EARL'S MOOD</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: config.color, letterSpacing: '0.08em' }}>
            {pulse.earl_mood} {config.arrow}
          </span>
        </div>
        <div style={{ width: 1, height: 14, background: '#1A2535' }} />
        <span style={{ fontSize: 11, color: '#5A6A7A', fontFamily: "'Lora', serif", fontStyle: 'italic', flex: 1 }}>
          {MOOD_LINES[pulse.earl_mood]}
        </span>
        <span style={{ fontSize: 10, color: '#2A3A4C', flexShrink: 0 }}>
          avg {pulse.this_week_avg} <span style={{ color: pulse.delta >= 0 ? '#34D399' : '#EF4444' }}>({deltaStr})</span>
        </span>
      </div>
    </div>
  );
}
