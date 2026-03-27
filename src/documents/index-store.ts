import Database from 'better-sqlite3';
import { getProjectDataDir } from '../config/paths.js';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

export interface StoredChunk {
  id: number;
  doc_path: string;
  doc_name: string;
  chunk_index: number;
  text: string;
  embedding?: string;
  created_at: string;
}

export class IndexStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const dir = getProjectDataDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const path = dbPath || join(dir, 'documents.db');
    this.db = new Database(path);

    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_path TEXT NOT NULL,
        doc_name TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        embedding TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_chunks_doc_path ON chunks(doc_path);
      CREATE INDEX IF NOT EXISTS idx_chunks_doc_name ON chunks(doc_name);
    `);
  }

  insertChunk(docPath: string, docName: string, chunkIndex: number, text: string, embedding?: number[]): number {
    const stmt = this.db.prepare(
      'INSERT INTO chunks (doc_path, doc_name, chunk_index, text, embedding) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      docPath,
      docName,
      chunkIndex,
      text,
      embedding ? JSON.stringify(embedding) : null
    );
    return result.lastInsertRowid as number;
  }

  insertChunksBatch(chunks: Array<{ docPath: string; docName: string; chunkIndex: number; text: string; embedding?: number[] }>): void {
    const stmt = this.db.prepare(
      'INSERT INTO chunks (doc_path, doc_name, chunk_index, text, embedding) VALUES (?, ?, ?, ?, ?)'
    );

    const insert = this.db.transaction((items: typeof chunks) => {
      for (const c of items) {
        stmt.run(c.docPath, c.docName, c.chunkIndex, c.text, c.embedding ? JSON.stringify(c.embedding) : null);
      }
    });

    insert(chunks);
  }

  getChunksByDoc(docPath: string): StoredChunk[] {
    return this.db.prepare('SELECT * FROM chunks WHERE doc_path = ? ORDER BY chunk_index').all(docPath) as StoredChunk[];
  }

  getAllChunks(): StoredChunk[] {
    return this.db.prepare('SELECT * FROM chunks ORDER BY doc_path, chunk_index').all() as StoredChunk[];
  }

  getChunkById(id: number): StoredChunk | undefined {
    return this.db.prepare('SELECT * FROM chunks WHERE id = ?').get(id) as StoredChunk | undefined;
  }

  searchText(query: string, limit: number = 10): StoredChunk[] {
    return this.db.prepare(
      'SELECT * FROM chunks WHERE text LIKE ? LIMIT ?'
    ).all(`%${query}%`, limit) as StoredChunk[];
  }

  deleteByDoc(docPath: string): void {
    this.db.prepare('DELETE FROM chunks WHERE doc_path = ?').run(docPath);
  }

  clear(): void {
    this.db.exec('DELETE FROM chunks');
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM chunks').get() as { count: number };
    return row.count;
  }

  listDocuments(): Array<{ doc_path: string; doc_name: string; chunk_count: number }> {
    return this.db.prepare(
      'SELECT doc_path, doc_name, COUNT(*) as chunk_count FROM chunks GROUP BY doc_path ORDER BY doc_name'
    ).all() as Array<{ doc_path: string; doc_name: string; chunk_count: number }>;
  }

  close(): void {
    this.db.close();
  }
}
