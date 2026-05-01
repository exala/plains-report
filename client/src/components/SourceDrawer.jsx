export default function SourceDrawer({ open, sourceName, sourceUrl, rawText }) {
  return (
    <div className="pr-source-drawer" style={{ maxHeight: open ? '220px' : '0', opacity: open ? 1 : 0 }}>
      <div style={{ background: '#070C14', border: '1px solid #141E2C', borderRadius: 6, padding: '13px 15px', fontSize: 12, lineHeight: 1.75, color: '#4A5A6A' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#2A3A4C', marginBottom: 8 }}>
          RAW FEED — {(sourceName || '').toUpperCase()}
        </div>
        {rawText || 'No source text available.'}
        {sourceUrl && (
          <div style={{ marginTop: 8 }}>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#E87722', fontSize: 11, fontWeight: 600 }}>
              Read original →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
