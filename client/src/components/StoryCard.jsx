import { useState } from 'react';
import EarlTake from './EarlTake.jsx';
import ScoreBar from './ScoreBar.jsx';
import SourceDrawer from './SourceDrawer.jsx';
import ShareButtons from './ShareButtons.jsx';

const TAG_COLORS = {
  RECRUITING:     { bg: 'rgba(232,119,34,0.12)',  text: '#E87722' },
  TRANSFERS:      { bg: 'rgba(139,92,246,0.12)',   text: '#A78BFA' },
  NIL:            { bg: 'rgba(236,72,153,0.12)',   text: '#F472B6' },
  'DEPTH CHART':  { bg: 'rgba(16,185,129,0.12)',   text: '#34D399' },
  'GAME DAY':     { bg: 'rgba(239,68,68,0.12)',    text: '#FC8181' },
  COACHING:       { bg: 'rgba(59,130,246,0.12)',   text: '#60A5FA' },
  RANKINGS:       { bg: 'rgba(196,151,58,0.12)',   text: '#C4973A' },
  SEC:            { bg: 'rgba(100,116,139,0.12)',  text: '#94A3B8' },
  HISTORY:        { bg: 'rgba(168,85,247,0.12)',   text: '#C084FC' },
};

export default function StoryCard({ article, isSaved, onSave, rawDescription }) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const isMassive = article.impact_score >= 9;
  const tag = isMassive
    ? { bg: 'rgba(239,68,68,0.15)', text: '#FC8181' }
    : TAG_COLORS[article.topic_tag] || { bg: 'rgba(255,255,255,0.08)', text: '#F0EDE6' };

  const cardStyle = {
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    // MASSIVE treatment
    ...(isMassive && {
      border: '2px solid #E87722',
      boxShadow: '0 0 24px rgba(232,119,34,0.25)',
    })
  };

  return (
    <div className="pr-card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', background: tag.bg, color: tag.text, padding: '3px 9px', borderRadius: 3 }}>
          {isMassive ? 'BREAKING' : article.topic_tag}
        </span>
        {onSave && (
          <button className={`pr-save-btn${isSaved ? ' saved' : ''}`} onClick={() => onSave(article.id)}>
            {isSaved ? '★' : '☆'}
          </button>
        )}
      </div>

      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMassive ? 20 : 17, fontWeight: isMassive ? 700 : 400, lineHeight: 1.35, color: '#F0EDE6', margin: 0 }}>
        {article.headline}
      </h3>

      <p style={{ fontSize: 13, lineHeight: 1.7, color: '#6A7A8A', margin: 0 }}>
        {article.earl_brief}
      </p>

      <EarlTake text={article.earl_take} />
      <ScoreBar score={article.impact_score} label={article.impact_label} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#3A4A5C' }}>
          <span style={{ color: '#6A7A8A', fontWeight: 500 }}>{article.source_name}</span>
          {article.source_name && <span style={{ margin: '0 6px', color: '#2A3A4C' }}>·</span>}
          {new Date(article.published_at).toLocaleDateString()}
        </div>
        <button className="pr-source-btn" onClick={() => setSourceOpen(p => !p)}>
          {sourceOpen ? 'HIDE SOURCE ↑' : 'VIEW SOURCE ↓'}
        </button>
      </div>

      <SourceDrawer open={sourceOpen} sourceName={article.source_name} sourceUrl={article.source_url} rawText={rawDescription} />

      <ShareButtons articleId={article.id} earlTake={article.earl_take} topicTag={article.topic_tag} impactScore={article.impact_score} />
    </div>
  );
}
