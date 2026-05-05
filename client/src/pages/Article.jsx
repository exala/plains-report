import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';
import Masthead from '../components/Masthead.jsx';
import StoryCard from '../components/StoryCard.jsx';
import OriginalCard from '../components/OriginalCard.jsx';

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/feed/${id}`)
      .then(res => setArticle(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A' }}>
      <Masthead />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>
        <button
          onClick={() => navigate('/feed')}
          style={{ background: 'none', border: 'none', color: '#5A6A7A', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', marginBottom: 24, display: 'block' }}
        >
          ← Back to feed
        </button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#4A5A6A' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#3A4A5C' }}>Earl is loading...</div>
          </div>
        )}

        {notFound && (
          <div style={{ textAlign: 'center', padding: '70px 24px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#2A3A4C', marginBottom: 12 }}>
              Earl looked everywhere.
            </div>
            <div style={{ fontSize: 15, color: '#3A4A5C', fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
              That story is not here. He checked twice. He made a note about it.
            </div>
          </div>
        )}

        {article && (
          article.is_original
            ? <OriginalCard article={article} isSaved={false} onSave={null} />
            : <StoryCard article={article} isSaved={false} onSave={null} rawDescription={article.raw_description} />
        )}
      </div>
    </div>
  );
}
