// config/applicants.js - Database configuration for the Co-op Support App

const Database = require("better-sqlite3");

const dbName =
  process.env.NODE_ENV === "test"
    ? "test.db"
    : "applicants.db";

const db = new Database(dbName);

db.exec(`
  CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    studentID TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    provisional_status TEXT DEFAULT 'Pending',
    final_status TEXT DEFAULT 'Pending',
    supervisor TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    studentID TEXT UNIQUE NOT NULL,
    report_status TEXT DEFAULT 'Not Submitted',
    evaluation_status TEXT DEFAULT 'Not Evaluated',
    deadline TEXT,
    report_filename TEXT,
    report_path TEXT,
    report_uploaded INTEGER DEFAULT 0,
    report_uploaded_at TEXT,
    evaluation_filename TEXT,
    evaluation_path TEXT,
    evaluation_type TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS evaluation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentID TEXT UNIQUE NOT NULL,
    evaluation_filename TEXT,
    evaluation_path TEXT
  );
`);

module.exports = db;