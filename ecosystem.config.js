module.exports = {
  apps: [
    {
      name: 'plains-report',
      script: 'server/index.js',
      cwd: '/home/ubuntu/plains-report',
      env: { NODE_ENV: 'production', TZ: 'America/Chicago' },
      restart_delay: 3000,
      max_restarts: 10
    },
    {
      name: 'plains-telegram',
      script: 'server/telegram/bot.js',
      cwd: '/home/ubuntu/plains-report',
      env: { NODE_ENV: 'production', TZ: 'America/Chicago' },
      restart_delay: 5000,
      max_restarts: 5,
      // Only start if TELEGRAM_BOT_TOKEN is set
      // If not configured, bot.js exits cleanly on its own
    }
  ]
};
