import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import Masthead from '../components/Masthead.jsx';
import StoryCard from '../components/StoryCard.jsx';
import OriginalCard from '../components/OriginalCard.jsx';

export default function Saved() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchSaved() {
    try {
      const res = await api.get('/saved');
      setArticles(res.data);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSaved(); }, []);

  async function handleUnsave(id) {
    await api.delete(`/saved/${id}`);
    setArticles(p => p.filter(a => a.id !== id));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A' }}>
      <Masthead />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <button onClick={() => navigate('/feed')} style={{ background: 'none', border: 'none', color: '#5A6A7A', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>← Back to feed</button>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#F0EDE6', margin: 0 }}>Saved Stories</h2>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#4A5A6A' }}>Loading...</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 24px' }}>
            <div style={{ fontSize: 38, marginBottom: 14 }}>☆</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#3A4A5C' }}>No saved stories yet</div>
            <div style={{ fontSize: 13, marginTop: 10, color: '#2A3A4C' }}>Star any story on the feed to save it here</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
            {articles.map(article =>
              article.is_original ? (
                <OriginalCard key={article.id} article={article} isSaved={true} onSave={handleUnsave} />
              ) : (
                <StoryCard key={article.id} article={article} isSaved={true} onSave={handleUnsave} rawDescription={article.raw_description} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
