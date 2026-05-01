const FILTERS = ['ALL', 'RECRUITING', 'TRANSFERS', 'NIL', 'DEPTH CHART', 'GAME DAY', 'COACHING', 'RANKINGS', 'SEC', 'HISTORY', 'SAVED'];

export default function FilterBar({ active, onChange, savedCount }) {
  return (
    <div style={{ borderBottom: '1px solid #111B28', padding: '13px 24px', background: 'rgba(6,11,22,0.6)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#2A3A4C', marginRight: 4 }}>FILTER</span>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`pr-filter-btn${active === f ? ' active' : ''}`}
            onClick={() => onChange(f)}
          >
            {f}{f === 'SAVED' && savedCount > 0 ? ` (${savedCount})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
