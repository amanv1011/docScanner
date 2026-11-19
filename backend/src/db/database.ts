import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DocumentRecord, AnalysisRecord, AnalysisResult } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'workbench.sqlite');
export const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    char_count INTEGER NOT NULL,
    token_estimate INTEGER NOT NULL,
    extracted_text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    document_ids TEXT NOT NULL,
    document_names TEXT NOT NULL,
    result_json TEXT NOT NULL,
    model_used TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export const documentRepo = {
  save(doc: DocumentRecord): void {
    const stmt = db.prepare(`
      INSERT INTO documents (
        id, filename, original_name, mime_type, file_size, char_count, token_estimate, extracted_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      doc.id,
      doc.filename,
      doc.originalName,
      doc.mimeType,
      doc.fileSize,
      doc.charCount,
      doc.tokenEstimate,
      doc.extractedText,
      doc.createdAt
    );
  },

  getById(id: string): DocumentRecord | null {
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      charCount: row.char_count,
      tokenEstimate: row.token_estimate,
      extractedText: row.extracted_text,
      createdAt: row.created_at,
    };
  },

  getByIds(ids: string[]): DocumentRecord[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`SELECT * FROM documents WHERE id IN (${placeholders})`);
    const rows = stmt.all(...ids) as any[];
    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      charCount: row.char_count,
      tokenEstimate: row.token_estimate,
      extractedText: row.extracted_text,
      createdAt: row.created_at,
    }));
  },

  getAll(): DocumentRecord[] {
    const stmt = db.prepare('SELECT * FROM documents ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      charCount: row.char_count,
      tokenEstimate: row.token_estimate,
      extractedText: row.extracted_text,
      createdAt: row.created_at,
    }));
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
    stmt.run(id);
    return true;
  },

  clearAll(): void {
    db.exec('DELETE FROM documents');
  }
};

export const analysisRepo = {
  save(analysis: AnalysisRecord): void {
    const stmt = db.prepare(`
      INSERT INTO analyses (
        id, prompt, document_ids, document_names, result_json, model_used, execution_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      analysis.id,
      analysis.prompt,
      JSON.stringify(analysis.documentIds),
      JSON.stringify(analysis.documentNames),
      JSON.stringify(analysis.result),
      analysis.modelUsed,
      analysis.executionTimeMs,
      analysis.createdAt
    );
  },

  getAll(): AnalysisRecord[] {
    const stmt = db.prepare('SELECT * FROM analyses ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      id: row.id,
      prompt: row.prompt,
      documentIds: JSON.parse(row.document_ids),
      documentNames: JSON.parse(row.document_names),
      result: JSON.parse(row.result_json) as AnalysisResult,
      modelUsed: row.model_used,
      executionTimeMs: row.execution_time_ms,
      createdAt: row.created_at,
    }));
  },

  getById(id: string): AnalysisRecord | null {
    const stmt = db.prepare('SELECT * FROM analyses WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      prompt: row.prompt,
      documentIds: JSON.parse(row.document_ids),
      documentNames: JSON.parse(row.document_names),
      result: JSON.parse(row.result_json) as AnalysisResult,
      modelUsed: row.model_used,
      executionTimeMs: row.execution_time_ms,
      createdAt: row.created_at,
    };
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM analyses WHERE id = ?');
    stmt.run(id);
    return true;
  }
};
