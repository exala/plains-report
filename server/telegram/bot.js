require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.TELEGRAM_ADMIN_USER_ID);
const PORT = process.env.PORT || 3001;
const BASE = `http://localhost:${PORT}/api/admin`;

if (!TOKEN || !ADMIN_ID) {
  console.log('Telegram bot not configured — TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_USER_ID missing. Skipping.');
  module.exports = { sendAlert: () => {} };
  process.exit(0);
}

// ── SERVICE ACCOUNT ──────────────────────────────────────────────────────────
// Cannot use /api/auth/register — it does not set is_admin = 1.
// Insert directly into DB, sign JWT directly. No API call.
let serviceToken = null;
let bot = null; // initialized AFTER service account is ready — see race condition note below

async function ensureServiceAccount() {
  await db.initDb();
  let user = db.prepare("SELECT * FROM users WHERE username = 'telegram_bot'").get();
  if (!user) {
    const password = require('crypto').randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(password, 10);
    db.prepare(
      "INSERT INTO users (username, email, password_hash, is_admin) VALUES ('telegram_bot', 'bot@plainsreport.internal', ?, 1)"
    ).run(hash);
    user = db.prepare("SELECT * FROM users WHERE username = 'telegram_bot'").get();
    console.log('Telegram service account created');
  }
  serviceToken = jwt.sign(
    { id: user.id, username: user.username, email: user.email, is_admin: 1 },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );
  console.log('Telegram service account JWT signed');
}

function headers() {
  return { Authorization: `Bearer ${serviceToken}` };
}

// ── SEND ALERT (exported for enrichmentWorker) ───────────────────────────────
// Safe to call at any time — checks bot is initialized before sending
function sendAlert(message) {
  if (!bot || !ADMIN_ID) return;
  bot.sendMessage(ADMIN_ID, message, { parse_mode: 'Markdown' }).catch(err => {
    console.error('Telegram sendAlert failed:', err.message);
  });
}

function reply(chatId, text) {
  return bot.sendMessage(chatId, text).catch(err => {
    console.error('Telegram reply failed:', err.message);
  });
}

function isAdmin(msg) {
  return msg.from && msg.from.id === ADMIN_ID;
}

function registerHandlers() {
  // ── COMMANDS ───────────────────────────────────────────────────────────────
  bot.onText(/\/start/, msg => {
    if (!isAdmin(msg)) return;
    reply(msg.chat.id,
      `*The Plains Report — Admin Bot*\n\n` +
      `*Commands:*\n` +
      `/queue — Queue status\n` +
      `/poll — Trigger RSS poll\n` +
      `/enrich — Trigger enrichment cycle\n` +
      `/history — Generate Auburn History post\n` +
      `/filmroom — Generate Film Room post\n` +
      `/reportcard — Generate SEC Report Card\n` +
      `/board — Generate Recruiting Board\n` +
      `/earls — Generate Earl vs The Internet\n\n` +
      `*Or just send any text message — Earl will answer it as a Mailbag post.*`
    );
  });

  bot.onText(/\/queue/, async msg => {
    if (!isAdmin(msg)) return;
    try {
      const res = await axios.get(`${BASE}/queue`, { headers: headers() });
      const q = res.data;
      reply(msg.chat.id,
        `*Queue Status*\n\nPending: ${q.pending}\nProcessing: ${q.processing}\nPublished: ${q.published}\nDead: ${q.dead}`
      );
    } catch (err) { reply(msg.chat.id, `Error: ${err.message}`); }
  });

  bot.onText(/\/poll/, async msg => {
    if (!isAdmin(msg)) return;
    reply(msg.chat.id, 'Polling RSS feeds...');
    try {
      const res = await axios.post(`${BASE}/poll`, {}, { headers: headers() });
      reply(msg.chat.id, `Poll complete. Checked ${res.data.sources_checked} sources.`);
    } catch (err) { reply(msg.chat.id, `Poll failed: ${err.message}`); }
  });

  bot.onText(/\/enrich/, async msg => {
    if (!isAdmin(msg)) return;
    reply(msg.chat.id, 'Running enrichment cycle...');
    try {
      await axios.post(`${BASE}/enrich`, {}, { headers: headers() });
      reply(msg.chat.id, 'Enrichment cycle complete.');
    } catch (err) { reply(msg.chat.id, `Enrich failed: ${err.message}`); }
  });

  async function triggerTier5(chatId, type) {
    reply(chatId, `Generating ${type}...`);
    try {
      const res = await axios.post(`${BASE}/tier5/${type}`, {}, { headers: headers() });
      reply(chatId, `Published: *${res.data.headline}*`);
    } catch (err) { reply(chatId, `Generation failed: ${err.message}`); }
  }

  bot.onText(/\/history/, msg => { if (!isAdmin(msg)) return; triggerTier5(msg.chat.id, 'history'); });
  bot.onText(/\/filmroom/, msg => { if (!isAdmin(msg)) return; triggerTier5(msg.chat.id, 'film_room'); });
  bot.onText(/\/reportcard/, msg => { if (!isAdmin(msg)) return; triggerTier5(msg.chat.id, 'report_card'); });
  bot.onText(/\/board/, msg => { if (!isAdmin(msg)) return; triggerTier5(msg.chat.id, 'recruiting_board'); });
  bot.onText(/\/earls/, msg => { if (!isAdmin(msg)) return; triggerTier5(msg.chat.id, 'earl_vs_internet'); });

  // ── FREE TEXT → MAILBAG ─────────────────────────────────────────────────────
  bot.on('message', async msg => {
    if (!isAdmin(msg)) return;
    if (msg.text && msg.text.startsWith('/')) return;
    const question = msg.text;
    if (!question || question.trim().length < 3) return;
    reply(msg.chat.id, `Earl is thinking about that...`);
    try {
      const res = await axios.post(`${BASE}/mailbag`, { question }, { headers: headers() });
      const article = res.data;
      reply(msg.chat.id, `*Published: ${article.headline}*\n\n_${article.earl_take}_`);
    } catch (err) { reply(msg.chat.id, `Mailbag failed: ${err.message}`); }
  });
}

// ── STARTUP — bot only starts polling AFTER service token is ready ────────────
ensureServiceAccount().then(() => {
  // Initialize bot here — not at module load — so serviceToken is guaranteed set
  // before any command handler can fire
  bot = new TelegramBot(TOKEN, {
    polling: true,
    request: {
      family: 4,
      timeout: 30000
    }
  });
  bot.on('polling_error', err => {
    console.error('Telegram polling failed:', err.message);
    if (err.stack) console.error(err.stack);
    if (err.errors) {
      err.errors.forEach((inner, index) => {
        console.error(`Telegram polling inner error ${index + 1}:`, inner.message || inner);
      });
    }
  });
  registerHandlers();
  console.log(`Telegram bot active. Admin ID: ${ADMIN_ID}`);
}).catch(err => {
  console.error('Telegram bot startup failed:', err.message);
  process.exit(1);
});

module.exports = { sendAlert };
