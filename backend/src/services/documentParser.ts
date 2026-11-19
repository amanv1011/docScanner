import { createRequire } from 'node:module';
import { ParseResult } from '../types/index.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export class UnsupportedFileTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFileTypeError';
  }
}

export class FileParsingError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'FileParsingError';
  }
}

/**
 * Parses raw file buffer into structured text and metadata.
 * Supports PDF (.pdf), Plain Text (.txt, .md), and CSV (.csv).
 */
export async function parseDocument(
  buffer: Buffer,
  originalFilename: string,
  mimeType?: string
): Promise<ParseResult> {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || '';

  if (buffer.length === 0) {
    throw new FileParsingError(`File "${originalFilename}" is empty.`);
  }

  try {
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return await parsePdf(buffer, originalFilename);
    } else if (ext === 'csv' || mimeType === 'text/csv') {
      return parseCsv(buffer, originalFilename);
    } else if (
      ext === 'txt' ||
      ext === 'md' ||
      ext === 'json' ||
      mimeType?.startsWith('text/')
    ) {
      return parsePlainText(buffer, originalFilename);
    } else {
      throw new UnsupportedFileTypeError(
        `Unsupported file type ".${ext}". Multi-Document Intelligence Workbench supports PDF, TXT, and CSV files.`
      );
    }
  } catch (error: any) {
    if (error instanceof UnsupportedFileTypeError) {
      throw error;
    }
    throw new FileParsingError(
      `Failed to parse document "${originalFilename}": ${error.message || 'Corrupted or unreadable format'}`
    );
  }
}

async function parsePdf(buffer: Buffer, filename: string): Promise<ParseResult> {
  const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
  const data = await parseFn(buffer);
  const text = (data.text || '').trim();

  if (!text) {
    throw new FileParsingError(
      `No extractable text found in PDF "${filename}". It might be scanned or password protected.`
    );
  }

  return {
    text: cleanExtractedText(text),
    charCount: text.length,
    tokenEstimate: Math.ceil(text.length / 4),
    metadata: {
      pages: data.numpages,
      info: data.info,
    },
  };
}

function parsePlainText(buffer: Buffer, filename: string): ParseResult {
  const text = buffer.toString('utf-8').trim();

  if (!text) {
    throw new FileParsingError(`Text file "${filename}" contains no text.`);
  }

  return {
    text: cleanExtractedText(text),
    charCount: text.length,
    tokenEstimate: Math.ceil(text.length / 4),
  };
}

/**
 * Parses CSV into clean readable aligned tabular text representation
 * that maintains relational structure for LLM reasoning.
 */
function parseCsv(buffer: Buffer, filename: string): ParseResult {
  const raw = buffer.toString('utf-8').trim();
  if (!raw) {
    throw new FileParsingError(`CSV file "${filename}" is empty.`);
  }

  // Parse CSV lines respecting quotes
  const lines = splitCsvLines(raw);
  if (lines.length === 0) {
    throw new FileParsingError(`CSV file "${filename}" contains no records.`);
  }

  const rows = lines.map((line) => parseCsvRow(line));
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);

  // Build markdown/readable table representation
  let formattedTable = `CSV Table: ${filename}\n`;
  formattedTable += `Columns (${headers.length}): ${headers.join(' | ')}\n`;
  formattedTable += `Total Data Rows: ${dataRows.length}\n\n`;

  // Include up to 250 structured rows
  const displayRows = dataRows.slice(0, 250);
  formattedTable += `| ${headers.join(' | ')} |\n`;
  formattedTable += `| ${headers.map(() => '---').join(' | ')} |\n`;

  for (const row of displayRows) {
    const padded = headers.map((_, i) => (row[i] !== undefined ? row[i].trim() : ''));
    formattedTable += `| ${padded.join(' | ')} |\n`;
  }

  if (dataRows.length > 250) {
    formattedTable += `\n[... truncated ${dataRows.length - 250} additional rows for LLM context ...]\n`;
  }

  return {
    text: formattedTable,
    charCount: formattedTable.length,
    tokenEstimate: Math.ceil(formattedTable.length / 4),
    metadata: {
      columns: headers,
      rowCount: dataRows.length,
    },
  };
}

function splitCsvLines(content: string): string[] {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
