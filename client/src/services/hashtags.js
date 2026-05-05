const HASHTAG_MAP = {
  RECRUITING:    '#AuburnRecruiting #AuburnFootball #WarEagle',
  TRANSFERS:     '#TransferPortal #AuburnFootball #WarEagle',
  NIL:           '#NIL #AuburnFootball #CollegeFootball',
  'DEPTH CHART': '#AuburnFootball #WarEagle #AuburnTigers',
  'GAME DAY':    '#AuburnFootball #WarEagle #SECFootball',
  COACHING:      '#AuburnFootball #WarEagle #AuburnTigers',
  RANKINGS:      '#AuburnFootball #CFB #CollegeFootball',
  SEC:           '#SECFootball #AuburnFootball #CollegeFootball',
  HISTORY:       '#AuburnHistory #AuburnFootball #WarEagle',
  MAILBAG:       '#AuburnFootball #WarEagle #EasyEarl',
};

export function getHashtags(topicTag, impactScore) {
  const base = HASHTAG_MAP[topicTag] || '#AuburnFootball #WarEagle';
  const breaking = impactScore >= 9 ? ' #Breaking' : '';
  return `${base}${breaking}`;
}

export function buildTweetUrl(articleId, earlTake, topicTag, impactScore) {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const articleUrl = `${siteUrl}/article/${articleId}`;
  const hashtags = getHashtags(topicTag, impactScore);

  // Trim take to 200 chars at word boundary
  let take = earlTake || '';
  if (take.length > 200) {
    take = take.slice(0, 200).replace(/\s+\S*$/, '') + '...';
  }

  const text = `${take}\n\n📍 The Plains Report\n${articleUrl}\n\n${hashtags}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
