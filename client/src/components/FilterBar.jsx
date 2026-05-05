const FILTERS = ['ALL', 'RECRUITING', 'TRANSFERS', 'NIL', 'DEPTH CHART', 'GAME DAY', 'COACHING', 'RANKINGS', 'SEC', 'HISTORY', 'MAILBAG', 'SAVED'];

export default function FilterBar({ active, onChange, savedCount, tagCounts = {} }) {
  return (
    <div style={{ borderBottom: '1px solid #111B28', padding: '13px 24px', background: 'rgba(6,11,22,0.6)' }}>
      <div className="pr-filter-inner" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#2A3A4C', marginRight: 4 }}>FILTER</span>
        {FILTERS.map(f => {
          const count = f === 'SAVED' ? savedCount : (tagCounts[f] || 0);
          const showBadge = f !== 'ALL' && f !== 'SAVED' && count > 0;
          return (
            <button
              key={f}
              className={`pr-filter-btn${active === f ? ' active' : ''}`}
              onClick={() => onChange(f)}
              style={{ position: 'relative' }}
            >
              {f}{f === 'SAVED' && savedCount > 0 ? ` (${savedCount})` : ''}
              {showBadge && (
                <span style={{
                  position: 'absolute', top: -5, right: -5,
                  background: active === f ? '#0A0F1A' : '#E87722',
                  color: active === f ? '#E87722' : '#0A0F1A',
                  fontSize: 9, fontWeight: 700, borderRadius: 8,
                  padding: '1px 4px', lineHeight: 1.4, minWidth: 14,
                  textAlign: 'center', border: active === f ? '1px solid #E87722' : 'none'
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
