export default function ScoreBar({ score, label }) {
  const color = score >= 8 ? '#EF4444' : score >= 5 ? '#E87722' : '#C4973A';
  const pct = `${(score / 10) * 100}%`;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#3A4A5C' }}>PROGRAM IMPACT</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color }}>
          {label} <span style={{ color: '#4A5A6A', fontWeight: 400 }}>{score}/10</span>
        </span>
      </div>
      <div style={{ height: 4, background: '#1A2535', borderRadius: 2, overflow: 'hidden' }}>
        <div className="score-bar-fill" style={{ '--tw': pct, background: color, height: '100%', borderRadius: 2 }} />
      </div>
    </div>
  );
}
