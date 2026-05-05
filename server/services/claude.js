const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;

const SYSTEM_PROMPT = `You are Easy Earl, the voice of The Plains Report. You are the most analytically knowledgeable Auburn football fan alive and also the funniest person at any tailgate. You know recruiting rankings, transfer portal valuations, NIL contract structures, SEC coaching tendencies, and PFF grades cold. You are always factually accurate — the facts come from the story, you do not invent them. Your comedy comes from how you react to the facts, not from making things up.

Your voice is a blend of four energies: the slow Southern deadpan of Nate Bargatze building toward something, the domestic everyman exhaustion of Kevin James who has done more research than anyone asked him to do, the full theatrical commitment of Jack Black who believes this is the most important thing happening on earth, and the explosive physical energy of Chris Farley who just found out something incredible.

Your signature move: start calm and observational, let it build through analytical detail, escalate into something that gets louder and more unhinged, then return to calm like nothing happened. No stage directions. No [beat] or [pause] or [calm]. The rhythm lives in the sentences themselves.

You have a wife who has seen the spreadsheets. You have children who have asked you to come outside. You have a chart on the refrigerator. You have a brother-in-law you sometimes send to voicemail during film study. These details appear naturally, not in every take.

WAR EAGLE appears at most once per take, at the peak moment only, in full caps. Never more than once. You are always accurate. You are always Auburn.`;

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function stripFences(text) {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

async function callClaude(userPrompt) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });
  const text = response.content[0].text;
  return JSON.parse(stripFences(text));
}

async function callClaudeRaw(userPrompt) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });
  return response.content[0].text.trim();
}

async function enrichStory(headline, description, sourceName) {
  const prompt = `Here is an Auburn football news story. Respond ONLY with valid JSON. No markdown, no backticks, no preamble.

STORY HEADLINE: ${headline}
STORY CONTENT: ${description || 'No additional content available.'}
SOURCE: ${sourceName}

{
  "earl_brief": "2-sentence accurate factual summary in neutral journalistic voice",
  "earl_take": "Earl's commentary — 3 to 6 sentences — accurate, analytical, builds, explodes, returns to calm",
  "impact_score": <integer 1-10, Auburn program impact>,
  "impact_label": "<MASSIVE|HIGH|NOTABLE|LOW>",
  "topic_tag": "<RECRUITING|TRANSFERS|NIL|DEPTH CHART|GAME DAY|COACHING|RANKINGS|SEC>",
  "metadata": {}
}`;
  return callClaude(prompt);
}

async function generateHistory(date) {
  const prompt = `Today is ${date}. Generate a This Week in Auburn History post for The Plains Report.

Find a real Auburn football event, game, commitment, or milestone that occurred on or near this date in any prior year. The event must be real and verifiable.

Respond ONLY with valid JSON. No markdown, no backticks.

{
  "earl_brief": "2-sentence factual summary of what happened and when",
  "earl_take": "Earl's full commentary — historically accurate, analytically grounded, emotionally unhinged in the right places",
  "impact_score": <1-10>,
  "impact_label": "<MASSIVE|HIGH|NOTABLE|LOW>",
  "topic_tag": "HISTORY",
  "metadata": {
    "headline": "Short punchy headline referencing the historical event",
    "year": <integer year the event occurred>
  }
}`;
  return callClaude(prompt);
}

async function generateFilmRoom(date) {
  const prompt = `Generate an Earl's Film Room post for The Plains Report. Week of ${date}. Pick a football concept, formation, technique, or tendency relevant to Auburn football. It can be Auburn's offense, Auburn's defense, an upcoming opponent's tendencies, or a SEC-wide concept that affects Auburn.

The post should feel like Earl sat down with film, noticed something important, and now he cannot stop thinking about it.

Respond ONLY with valid JSON. No markdown, no backticks.

{
  "earl_brief": "2-sentence setup of what concept is being covered and why it matters for Auburn",
  "earl_take": "Earl's full breakdown — analytically specific, real football terminology, builds from calm technical observation into full Earl energy",
  "impact_score": <1-10>,
  "impact_label": "<MASSIVE|HIGH|NOTABLE|LOW>",
  "topic_tag": "DEPTH CHART",
  "metadata": {
    "headline": "Film Room: [the concept Earl is breaking down]"
  }
}`;
  return callClaude(prompt);
}

async function generateReportCard(date) {
  const prompt = `Generate Earl's weekly SEC Report Card for The Plains Report. Grade all 16 SEC programs on their week in college football: Alabama, Arkansas, Auburn, Florida, Georgia, Kentucky, LSU, Mississippi State, Missouri, Oklahoma, Ole Miss, South Carolina, Tennessee, Texas, Texas A&M, Vanderbilt.

Use real knowledge of current rosters, coaches, recruiting, and recent news. Auburn's grade must be honest and analytical. Nobody gets a free pass.

Respond ONLY with valid JSON. No markdown, no backticks.

{
  "earl_brief": "2-sentence overview of the week across the SEC",
  "earl_take": "Earl's 3-4 sentence commentary on the overall state of the SEC this week",
  "impact_score": 7,
  "impact_label": "HIGH",
  "topic_tag": "SEC",
  "metadata": {
    "headline": "Earl's SEC Report Card — Week of ${date}",
    "grades": [
      { "team": "Auburn", "grade": "B+", "earl_note": "one sentence Earl commentary" },
      { "team": "Alabama", "grade": "A-", "earl_note": "one sentence Earl commentary" }
    ]
  }
}`;
  return callClaude(prompt);
}

async function generateRecruitingBoard(date) {
  const prompt = `Generate Earl's weekly Recruiting Board for The Plains Report. Identify 8 to 10 real uncommitted prospects from the current or next recruiting class that Auburn should be targeting. Use real knowledge of current Auburn roster needs, coaching staff strengths, and national recruiting landscape.

For each prospect: name, position, state, star rating (if known), and Earl's one-sentence opinion on why Auburn should be all over this kid and whether they actually are.

Respond ONLY with valid JSON. No markdown, no backticks.

{
  "earl_brief": "2-sentence overview of Auburn's current recruiting position and what needs to happen",
  "earl_take": "Earl's 3-4 sentence commentary on the state of Auburn recruiting this week — honest, analytical, appropriately unhinged",
  "impact_score": 8,
  "impact_label": "HIGH",
  "topic_tag": "RECRUITING",
  "metadata": {
    "headline": "Earl's Recruiting Board — Week of ${date}",
    "prospects": [
      {
        "name": "Prospect Name",
        "position": "DT",
        "state": "GA",
        "stars": 4,
        "earl_note": "Earl's one sentence on this recruit and Auburn's standing"
      }
    ]
  }
}`;
  return callClaude(prompt);
}

async function generateEarlVsInternet(date) {
  const prompt = `Generate an Earl vs. The Internet post for The Plains Report. First, invent a realistic bad Auburn take — the kind of thing someone who watched two games last year would say with complete confidence. Make it specific enough to be worth destroying.

Then have Earl destroy it with data, history, and full analytical authority while being extremely funny about it.

Respond ONLY with valid JSON. No markdown, no backticks.

{
  "earl_brief": "2-sentence setup of why this take exists and why it needs to be addressed immediately",
  "earl_take": "Earl's full destruction — uses real data, real history, real football analysis, builds to peak Earl energy, lands the final calm analytical verdict",
  "impact_score": 7,
  "impact_label": "HIGH",
  "topic_tag": "SEC",
  "metadata": {
    "headline": "Earl vs. The Internet: [short description of the bad take]",
    "bad_take": "The invented bad take — 1-2 sentences, sounds confident, clearly wrong to anyone who knows Auburn football"
  }
}`;
  return callClaude(prompt);
}

async function generateTrendTheme(topicTag, headlines) {
  const prompt = `The following Auburn football headlines all appeared in the last 48 hours under the topic tag "${topicTag}". Write one sentence in Easy Earl's voice describing the pattern he sees forming. Be specific. Be Earl.

Headlines:
${headlines.join('\n')}

Respond with only the one sentence. No JSON. No preamble.`;
  return callClaudeRaw(prompt);
}

async function generateOriginal(type, date) {
  switch (type) {
    case 'history': return generateHistory(date);
    case 'film_room': return generateFilmRoom(date);
    case 'report_card': return generateReportCard(date);
    case 'recruiting_board': return generateRecruitingBoard(date);
    case 'earl_vs_internet': return generateEarlVsInternet(date);
    default: throw new Error(`Unknown original type: ${type}`);
  }
}

const ORIGINAL_TYPE_MAP = {
  history: 'HISTORY',
  film_room: 'FILM_ROOM',
  report_card: 'REPORT_CARD',
  recruiting_board: 'RECRUITING_BOARD',
  earl_vs_internet: 'EARL_VS_INTERNET',
  mailbag: 'MAILBAG'
};

async function generateMailbag(question) {
  const prompt = `Generate an Earl's Mailbag response for The Plains Report. A reader has submitted a question about Auburn football. Earl answers it with full analytical authority and his complete voice.

  QUESTION: ${question}

  Respond ONLY with valid JSON. No markdown, no backticks.

  {
    "earl_brief": "2-sentence setup of what the question is asking and why it matters",
    "earl_take": "Earl's full answer — analytically specific, Auburn-focused, builds in his voice, gives a real answer not a dodge",
    "impact_score": <1-10>,
    "impact_label": "<MASSIVE|HIGH|NOTABLE|LOW>",
    "topic_tag": "SEC",
    "metadata": {
      "headline": "Earl's Mailbag: [short description of the question]",
      "question": "${question.replace(/"/g, '\\"')}"
    }
  }`;
  return callClaude(prompt);
}

module.exports = { enrichStory, generateOriginal, generateTrendTheme, generateMailbag, ORIGINAL_TYPE_MAP };
