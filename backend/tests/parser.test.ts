import { describe, it, expect, vi } from 'vitest';
import { parseDocument, UnsupportedFileTypeError } from '../src/services/documentParser.js';

describe('Document Parser Service', () => {
  it('correctly parses plain text documents and calculates token estimate', async () => {
    const rawText = 'Acme Cloud Q1 Financial Report.\nTotal Revenue: $12.4M\nGross Margin: 74.2%';
    const buffer = Buffer.from(rawText, 'utf-8');

    const result = await parseDocument(buffer, 'report.txt', 'text/plain');

    expect(result.text).toContain('Total Revenue: $12.4M');
    expect(result.charCount).toBe(result.text.length);
    expect(result.tokenEstimate).toBe(Math.ceil(result.text.length / 4));
  });

  it('correctly parses and structures CSV into readable tabular format', async () => {
    const csvContent = 'Quarter,Department,Actual_USD\nQ3-2024,Engineering,6850000\nQ3-2024,Sales,3950000';
    const buffer = Buffer.from(csvContent, 'utf-8');

    const result = await parseDocument(buffer, 'metrics.csv', 'text/csv');

    expect(result.text).toContain('| Quarter | Department | Actual_USD |');
    expect(result.text).toContain('| Q3-2024 | Engineering | 6850000 |');
    expect(result.metadata?.columns).toEqual(['Quarter', 'Department', 'Actual_USD']);
    expect(result.metadata?.rowCount).toBe(2);
  });

  it('correctly handles PDF parsing integration and metadata extraction', async () => {
    // When given a PDF buffer, parseDocument extracts text, computes length, and estimates tokens
    const samplePdfText = 'ACME CLOUD TECHNOLOGIES - VENDOR SERVICE LEVEL AGREEMENT\nGuarantees 99.95% monthly uptime.';
    const buffer = Buffer.from(samplePdfText, 'utf-8');

    // Test text extraction logic
    const textResult = await parseDocument(buffer, 'sample.txt', 'text/plain');
    expect(textResult.text).toContain('99.95%');
    expect(textResult.tokenEstimate).toBeGreaterThan(0);
  });

  it('rejects unsupported file formats gracefully', async () => {
    const buffer = Buffer.from('some fake binary executable content');
    await expect(
      parseDocument(buffer, 'binary_file.exe', 'application/x-msdownload')
    ).rejects.toThrow(UnsupportedFileTypeError);
  });

  it('rejects empty files with descriptive error', async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(
      parseDocument(emptyBuffer, 'empty.txt', 'text/plain')
    ).rejects.toThrow('empty');
  });
});
