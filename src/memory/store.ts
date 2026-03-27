// Memory store using better-sqlite3 for persistent storage
// Note: better-sqlite3 is a native SQLite binding, not a shell command

import Database from 'better-sqlite3';
import { GLOBAL_DB_FILE, ensureGlobalDirs } from '../config/paths.js';

export interface MemoryEntry {
  id: number;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    ensureGlobalDirs();
    this.db = new Database(dbPath || GLOBAL_DB_FILE);
    this.db.pragma('journal_mode = WAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        summary TEXT NOT NULL,
        model TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  save(key: string, value: string, category: string = 'general'): void {
    this.db.prepare(`
      INSERT INTO memories (key, value, category) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, category = ?, updated_at = datetime('now')
    `).run(key, value, category, value, category);
  }

  get(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM memories WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value || null;
  }

  getAll(): MemoryEntry[] {
    return this.db.prepare('SELECT * FROM memories ORDER BY updated_at DESC').all() as MemoryEntry[];
  }

  getByCategory(category: string): MemoryEntry[] {
    return this.db.prepare('SELECT * FROM memories WHERE category = ? ORDER BY updated_at DESC').all(category) as MemoryEntry[];
  }

  delete(key: string): void {
    this.db.prepare('DELETE FROM memories WHERE key = ?').run(key);
  }

  search(query: string): MemoryEntry[] {
    return this.db.prepare(
      'SELECT * FROM memories WHERE key LIKE ? OR value LIKE ? ORDER BY updated_at DESC'
    ).all(`%${query}%`, `%${query}%`) as MemoryEntry[];
  }

  saveSession(summary: string, model: string): void {
    this.db.prepare('INSERT INTO sessions (summary, model) VALUES (?, ?)').run(summary, model);
  }

  getRecentSessions(limit: number = 5): Array<{ id: number; summary: string; model: string; created_at: string }> {
    return this.db.prepare(
      'SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?'
    ).all(limit) as Array<{ id: number; summary: string; model: string; created_at: string }>;
  }

  close(): void {
    this.db.close();
  }
}
