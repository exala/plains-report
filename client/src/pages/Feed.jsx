import { useState, useEffect, useCallback } from 'react';
import api from '../api.js';
import Masthead from '../components/Masthead.jsx';
import TrendAlert from '../components/TrendAlert.jsx';
import EarlMeter from '../components/EarlMeter.jsx';
import FilterBar from '../components/FilterBar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import DigestCard from '../components/DigestCard.jsx';
import StoryCard from '../components/StoryCard.jsx';
import OriginalCard from '../components/OriginalCard.jsx';
import { useAuth } from '../App.jsx';

export default function Feed() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [digest, setDigest] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [tagCounts, setTagCounts] = useState({});
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const isSearching = searchResults !== null;

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (activeFilter !== 'ALL' && activeFilter !== 'SAVED') params.tag = activeFilter;
      const res = await api.get('/feed', { params });
      setArticles(res.data.articles);
      setTotalPages(res.data.pages);
    } catch {}
    finally { setLoading(false); }
  }, [activeFilter, page]);

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/saved');
      setSavedIds(new Set(res.data.map(a => a.id)));
    } catch {}
  }, [user]);

  const fetchSavedArticles = useCallback(async () => {
    if (!user) return [];
    try { return (await api.get('/saved')).data; } catch { return []; }
  }, [user]);

  const fetchTagCounts = useCallback(async () => {
    try {
      const res = await api.get('/feed/tag-counts');
      setTagCounts(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    api.get('/feed/digest').then(res => setDigest(res.data)).catch(() => {});
    fetchSaved();
    fetchTagCounts();
  }, [fetchSaved, fetchTagCounts]);

  useEffect(() => {
    if (isSearching) return;
    if (activeFilter === 'SAVED') {
      fetchSavedArticles().then(data => { setArticles(data); setLoading(false); });
    } else {
      fetchArticles();
    }
  }, [activeFilter, page, fetchArticles, fetchSavedArticles, isSearching]);

  async function handleSearch(q) {
    setLoading(true);
    try {
      const res = await api.get(`/feed/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.articles);
      setSearchQuery(q);
    } catch {}
    finally { setLoading(false); }
  }

  function handleClearSearch() {
    setSearchResults(null);
    setSearchQuery('');
  }

  async function handleSave(id) {
    if (!user) { window.location.href = '/login'; return; }
    if (savedIds.has(id)) {
      await api.delete(`/saved/${id}`);
      setSavedIds(p => { const n = new Set(p); n.delete(id); return n; });
    } else {
      await api.post(`/saved/${id}`);
      setSavedIds(p => new Set([...p, id]));
    }
    if (activeFilter === 'SAVED') fetchSavedArticles().then(setArticles);
  }

  function handleFilterChange(f) {
    setActiveFilter(f);
    setPage(1);
    setSearchResults(null);
    setSearchQuery('');
    fetchTagCounts();
  }

  const displayArticles = isSearching ? searchResults : articles;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A' }}>
      <Masthead />
      <TrendAlert />
      <EarlMeter />
      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} isSearching={isSearching} />
      <FilterBar active={activeFilter} onChange={handleFilterChange} savedCount={savedIds.size} tagCounts={tagCounts} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
        {!isSearching && <DigestCard digest={digest} />}

        {isSearching && (
          <div style={{ marginBottom: 20, fontSize: 13, color: '#5A6A7A' }}>
            {displayArticles.length} result{displayArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#3A4A5C' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#4A5A6A' }}>Earl is thinking...</div>
          </div>
        ) : displayArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 24px', color: '#2A3A4C' }}>
            <div style={{ fontSize: 38, marginBottom: 14 }}>☆</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#3A4A5C' }}>
              {activeFilter === 'SAVED' ? 'No saved stories yet' : isSearching ? 'Earl found nothing' : 'No stories found'}
            </div>
            <div style={{ fontSize: 13, marginTop: 10, color: '#2A3A4C' }}>
              {activeFilter === 'SAVED' ? 'Star any story to save it here' : isSearching ? 'Try different search terms' : 'Check back soon — Earl is on it'}
            </div>
          </div>
        ) : (
          <>
            <div className="pr-feed-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
              {displayArticles.map(article =>
                article.is_original ? (
                  <OriginalCard key={article.id} article={article} isSaved={savedIds.has(article.id)} onSave={handleSave} />
                ) : (
                  <StoryCard key={article.id} article={article} isSaved={savedIds.has(article.id)} onSave={handleSave} rawDescription={article.raw_description} />
                )
              )}
            </div>

            {!isSearching && totalPages > 1 && activeFilter !== 'SAVED' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 20px', background: 'none', border: '1px solid #1A2535', color: page === 1 ? '#2A3A4C' : '#E87722', borderRadius: 4, cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                  ← Prev
                </button>
                <span style={{ fontSize: 12, color: '#4A5A6A', alignSelf: 'center' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '8px 20px', background: 'none', border: '1px solid #1A2535', color: page === totalPages ? '#2A3A4C' : '#E87722', borderRadius: 4, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ borderTop: '1px solid #1A2535', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1A2535' }}>The Plains Report</div>
        <div style={{ fontSize: 10, color: '#141E2C', marginTop: 6, letterSpacing: '0.14em', fontWeight: 600 }}>AUBURN FOOTBALL INTELLIGENCE — ALL EARL, ALL THE TIME</div>
      </div>
    </div>
  );
}
