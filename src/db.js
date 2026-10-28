const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// En Railway: define DB_PATH=/data/beca.db y monta un Volume en /data.
// En local: usa ./data/beca.db automáticamente.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'beca.db');

// better-sqlite3 NO crea carpetas, así que las creamos antes de abrir la BD.
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ------------------------------------------------------------------
// PEGA AQUÍ tus CREATE TABLE / db.exec(...) originales, por ejemplo:
//
// db.exec(`
//   CREATE TABLE IF NOT EXISTS estudiantes (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     nombre TEXT NOT NULL
//   );
// `);
// ------------------------------------------------------------------

module.exports = db;
