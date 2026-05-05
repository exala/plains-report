import { useState } from 'react';
import { buildTweetUrl } from '../services/hashtags.js';

const BTN_STYLE = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  color: '#5A6A7A',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid #1A2535',
  borderRadius: 4,
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: "'IBM Plex Sans', sans-serif",
  transition: 'all 0.15s ease',
};

function CopyButton({ label, onCopy }) {
  const [copied, setCopied] = useState(false);
  async function handleClick() {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button style={{ ...BTN_STYLE, color: copied ? '#34D399' : '#5A6A7A', borderColor: copied ? 'rgba(52,211,153,0.3)' : '#1A2535' }} onClick={handleClick}>
      {copied ? '✓ Copied!' : label}
    </button>
  );
}

export default function ShareButtons({ articleId, earlTake, topicTag, impactScore }) {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const articleUrl = `${siteUrl}/article/${articleId}`;
  const tweetUrl = buildTweetUrl(articleId, earlTake, topicTag, impactScore);

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', paddingTop: 4 }}>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...BTN_STYLE, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        𝕏 Share
      </a>
      <CopyButton label="Copy Link" onCopy={() => navigator.clipboard.writeText(articleUrl)} />
      <CopyButton label="Copy Earl's Take" onCopy={() => navigator.clipboard.writeText(earlTake || '')} />
    </div>
  );
}
