import { useState } from 'react';
import EarlTake from './EarlTake.jsx';
import ScoreBar from './ScoreBar.jsx';
import ShareButtons from './ShareButtons.jsx';

const TYPE_LABELS = {
  HISTORY:          { label: 'AUBURN HISTORY',         color: '#C084FC' },
  FILM_ROOM:        { label: "EARL'S FILM ROOM",        color: '#34D399' },
  REPORT_CARD:      { label: 'SEC REPORT CARD',         color: '#60A5FA' },
  RECRUITING_BOARD: { label: "EARL'S RECRUITING BOARD", color: '#E87722' },
  EARL_VS_INTERNET: { label: 'EARL VS THE INTERNET',    color: '#FC8181' },
  MAILBAG:          { label: "EARL'S MAILBAG",          color: '#F472B6' },
};

const GRADE_COLOR = {
  'A+': '#34D399', 'A': '#34D399', 'A-': '#6EE7B7',
  'B+': '#86EFAC', 'B': '#A3E635', 'B-': '#BEF264',
  'C+': '#FDE047', 'C': '#FCD34D', 'C-': '#FBBF24',
  'D+': '#FB923C', 'D': '#F87171', 'F': '#EF4444'
};

function ReportCardView({ grades }) {
  if (!grades?.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 4 }}>
      {grades.map(g => (
        <div key={g.team} style={{ background: '#0A0F1A', border: '1px solid #1A2535', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#F0EDE6' }}>{g.team}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: GRADE_COLOR[g.grade] || '#E87722' }}>{g.grade}</span>
          </div>
          <p style={{ fontSize: 11, color: '#5A6A7A', lineHeight: 1.5, margin: 0 }}>{g.earl_note}</p>
        </div>
      ))}
    </div>
  );
}

function ProspectListView({ prospects }) {
  if (!prospects?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      {prospects.map((p, i) => (
        <div key={i} style={{ background: '#0A0F1A', border: '1px solid #1A2535', borderRadius: 6, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E87722' }}>{p.position}</div>
            <div style={{ fontSize: 10, color: '#4A5A6A' }}>{p.state}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6', marginBottom: 3 }}>
              {p.name}{p.stars && <span style={{ fontSize: 11, color: '#C4973A', marginLeft: 6 }}>{'★'.repeat(p.stars)}</span>}
            </div>
            <p style={{ fontSize: 12, color: '#5A6A7A', lineHeight: 1.5, margin: 0 }}>{p.earl_note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OriginalCard({ article, isSaved, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const isMassive = article.impact_score >= 9;
  const typeInfo = TYPE_LABELS[article.original_type] || { label: article.original_type, color: '#E87722' };
  const meta = article.metadata || {};

  const cardStyle = {
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    ...(isMassive && {
      border: '2px solid #E87722',
      boxShadow: '0 0 24px rgba(232,119,34,0.25)',
    })
  };

  return (
    <div className="pr-card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', background: 'rgba(255,255,255,0.06)', color: isMassive ? '#FC8181' : typeInfo.color, padding: '3px 9px', borderRadius: 3 }}>
          {isMassive ? 'BREAKING' : typeInfo.label}
        </span>
        {onSave && (
          <button className={`pr-save-btn${isSaved ? ' saved' : ''}`} onClick={() => onSave(article.id)}>
            {isSaved ? '★' : '☆'}
          </button>
        )}
      </div>

      {/* MAILBAG: show question above Earl's response */}
      {article.original_type === 'MAILBAG' && meta.question && (
        <div style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 6, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#F472B6', marginBottom: 6 }}>READER QUESTION</div>
          <p style={{ fontSize: 13, color: '#8A7A8A', margin: 0, fontStyle: 'italic' }}>{meta.question}</p>
        </div>
      )}

      {/* EARL VS INTERNET: show bad take above Earl's destruction */}
      {article.original_type === 'EARL_VS_INTERNET' && meta.bad_take && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#FC8181', marginBottom: 6 }}>THE BAD TAKE</div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: '#8A7A7A', margin: 0, fontStyle: 'italic' }}>{meta.bad_take}</p>
        </div>
      )}

      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMassive ? 20 : 17, fontWeight: isMassive ? 700 : 400, lineHeight: 1.35, color: '#F0EDE6', margin: 0 }}>
        {article.headline}
      </h3>

      <p style={{ fontSize: 13, lineHeight: 1.7, color: '#6A7A8A', margin: 0 }}>{article.earl_brief}</p>
      <EarlTake text={article.earl_take} />

      {article.original_type === 'REPORT_CARD' && meta.grades && (
        <>
          <button className="pr-read-more" onClick={() => setExpanded(p => !p)}>
            {expanded ? '↑ Hide Grades' : '↓ Show All 16 Grades'}
          </button>
          {expanded && <ReportCardView grades={meta.grades} />}
        </>
      )}

      {article.original_type === 'RECRUITING_BOARD' && meta.prospects && (
        <>
          <button className="pr-read-more" onClick={() => setExpanded(p => !p)}>
            {expanded ? '↑ Hide Board' : `↓ Show Recruiting Board (${meta.prospects.length} prospects)`}
          </button>
          {expanded && <ProspectListView prospects={meta.prospects} />}
        </>
      )}

      <ScoreBar score={article.impact_score} label={article.impact_label} />

      <div style={{ fontSize: 11, color: '#3A4A5C' }}>
        <span style={{ color: '#4A5A6A' }}>
          {new Date(article.published_at).toLocaleDateString('en-US', {
            timeZone: 'America/Chicago',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
        {article.original_type === 'HISTORY' && meta.year && (
          <span style={{ marginLeft: 8, color: '#C084FC', fontWeight: 600 }}>— {meta.year}</span>
        )}
      </div>

      <ShareButtons articleId={article.id} earlTake={article.earl_take} topicTag={article.topic_tag} impactScore={article.impact_score} />
    </div>
  );
}
