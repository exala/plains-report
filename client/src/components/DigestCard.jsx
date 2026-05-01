import { useState } from 'react';

export default function DigestCard({ digest }) {
  const [expanded, setExpanded] = useState(false);
  if (!digest) return null;

  const isFallback = digest.type === 'fallback';
  const text = isFallback
    ? `Earl has ${digest.articles?.length || 0} top stories on his radar this week. Here is what is happening on the Plains and in the SEC that you need to know about right now.`
    : digest.earl_take;

  return (
    <div className="pr-digest-card" style={{ padding: '26px 30px', marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: '#E87722', marginBottom: 9 }}>
            ★ EASY EARL'S WEEKLY DIGEST
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#F0EDE6', margin: 0, lineHeight: 1.3 }}>
            {isFallback ? "The Week on the Plains" : (digest.metadata?.headline || "Earl's Weekly Breakdown")}
          </h2>
        </div>
        <div style={{ fontSize: 10, color: '#3A4A5C', flexShrink: 0, letterSpacing: '0.06em' }}>UPDATED TODAY</div>
      </div>

      <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.85, color: '#7A8A9A', maxHeight: expanded ? '600px' : '58px', overflow: 'hidden', transition: 'max-height 0.45s ease' }}>
        <span style={{ fontFamily: "'Lora', serif", fontStyle: 'italic' }}>{text}</span>
      </div>

      <button className="pr-read-more" onClick={() => setExpanded(p => !p)} style={{ marginTop: 12 }}>
        {expanded ? "↑ Collapse Earl's Digest" : "↓ Read Earl's Full Digest"}
      </button>
    </div>
  );
}
