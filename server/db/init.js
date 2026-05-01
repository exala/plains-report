require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(process.cwd(), 'db');
const dbPath = process.env.DB_PATH || path.join(dbDir, 'plains.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created db directory');
}

async function init() {
  const SQL = await initSqlJs();
  
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }
  
  // Run pragmas manually
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.run(schema);
  console.log('Schema applied');

  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  db.run(seed);
  console.log('Seed data inserted');

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  db.close();
  console.log('Database initialized at', dbPath);
}

init().catch(console.error);
