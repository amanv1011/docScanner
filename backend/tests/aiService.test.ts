import { describe, it, expect } from 'vitest';
import { buildIsolatedDocumentContext, generateDynamicMockAnalysis } from '../src/services/aiService.js';
import { DocumentRecord } from '../src/types/index.js';

describe('AI Multi-Document Service & Boundary Isolation', () => {
  const sampleDocs: DocumentRecord[] = [
    {
      id: 'doc-1',
      filename: 'doc-1-Q1.txt',
      originalName: 'Q1_Report.txt',
      mimeType: 'text/plain',
      fileSize: 1024,
      charCount: 200,
      tokenEstimate: 50,
      extractedText: 'Q1 2024 Revenue was $12.4M with 74.2% Gross Margin. Net Income: $820K.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc-2',
      filename: 'doc-2-Q2.txt',
      originalName: 'Q2_Report.txt',
      mimeType: 'text/plain',
      fileSize: 1100,
      charCount: 220,
      tokenEstimate: 55,
      extractedText: 'Q2 2024 Revenue was $14.1M with 71.5% Gross Margin. Operating Loss: -$410K.',
      createdAt: new Date().toISOString(),
    },
  ];

  it('maintains strict XML document boundaries with IDs and filenames', () => {
    const context = buildIsolatedDocumentContext(sampleDocs);

    expect(context).toContain('<document_corpus total_documents="2">');
    expect(context).toContain('<document index="1" id="doc-1" name="Q1_Report.txt"');
    expect(context).toContain('--- BEGIN DOCUMENT: Q1_Report.txt ---');
    expect(context).toContain('--- END DOCUMENT: Q1_Report.txt ---');
    expect(context).toContain('<document index="2" id="doc-2" name="Q2_Report.txt"');
  });

  it('generates structured analysis with facts, interpretations, comparisons and discrepancies', () => {
    const analysis = generateDynamicMockAnalysis(sampleDocs, 'Compare financial revenue and margins');

    expect(analysis.summary).toBeDefined();
    expect(analysis.keyFindings.length).toBeGreaterThan(0);
    
    // Check that sourceDocument is attributed
    const docNames = sampleDocs.map((d) => d.originalName);
    for (const finding of analysis.keyFindings) {
      expect(docNames).toContain(finding.sourceDocument);
      expect(['fact', 'interpretation']).toContain(finding.category);
      expect(finding.evidence).toBeDefined();
    }

    // Check comparisons matrix
    expect(analysis.comparisons.length).toBeGreaterThan(0);
    expect(analysis.comparisons[0].documentValues['Q1_Report.txt']).toBeDefined();
    expect(analysis.comparisons[0].documentValues['Q2_Report.txt']).toBeDefined();

    // Check discrepancies
    expect(analysis.discrepancies.length).toBeGreaterThan(0);
    expect(analysis.discrepancies[0].documentsInvolved.length).toBeGreaterThanOrEqual(1);

    // Check source references
    expect(analysis.sourceReferences.length).toBe(2);
    expect(analysis.sourceReferences[0].documentName).toBe('Q1_Report.txt');
  });
});
