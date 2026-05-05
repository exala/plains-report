import { useState } from 'react';

export default function SearchBar({ onSearch, onClear, isSearching }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim().length >= 3) onSearch(query.trim());
  }

  function handleClear() {
    setQuery('');
    onClear();
  }

  return (
    <div style={{ padding: '12px 24px', background: 'rgba(6,11,22,0.4)', borderBottom: '1px solid #0D1620' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 480 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search everything Earl has said..."
            style={{
              flex: 1, padding: '7px 12px', background: '#0F1825', border: '1px solid #1A2535',
              borderRadius: 5, color: '#F0EDE6', fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13, outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={query.trim().length < 3}
            style={{
              padding: '7px 14px', background: query.trim().length >= 3 ? '#E87722' : '#1A2535',
              border: 'none', borderRadius: 5, color: query.trim().length >= 3 ? '#0A0F1A' : '#3A4A5C',
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: '0.07em', cursor: query.trim().length >= 3 ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease'
            }}
          >
            SEARCH
          </button>
        </form>
        {isSearching && (
          <button onClick={handleClear} style={{
            fontSize: 11, fontWeight: 600, color: '#E87722', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
            letterSpacing: '0.07em'
          }}>
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
