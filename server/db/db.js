const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const configuredDbPath = process.env.DB_PATH || './db/plains.db';
const dbPath = path.isAbsolute(configuredDbPath)
  ? configuredDbPath
  : path.resolve(projectRoot, configuredDbPath);

let db = null;

async function initDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  // Run pragmas manually
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Create a compatible wrapper that mimics better-sqlite3 API
function createDbWrapper() {
  return {
    // Prepare a statement
    prepare(sql) {
      return {
        // Get single row
        get(...params) {
          const stmt = db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          let result = null;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        },
        // Get all rows
        all(...params) {
          const stmt = db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },
        // Run query (insert/update/delete)
        run(...params) {
          db.run(sql, params);
          saveDb();
          // Get last insert rowid
          const lastId = db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0;
          return { lastInsertRowid: lastId, changes: db.getRowsModified() };
        }
      };
    },
    // Execute raw SQL
    exec(sql) {
      db.run(sql);
      saveDb();
    },
    // Close database
    close() {
      if (db) {
        saveDb();
        db.close();
        db = null;
      }
    },
    // Pragma
    pragma(pragma) {
      db.run(`PRAGMA ${pragma}`);
    }
  };
}

let dbWrapper = null;

async function getDbWrapper() {
  if (!dbWrapper) {
    await initDb();
    dbWrapper = createDbWrapper();
  }
  return dbWrapper;
}

// Initialize on module load
initDb().then(() => {
  dbWrapper = createDbWrapper();
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

module.exports = {
  getDbWrapper,
  initDb,
  saveDb
};
