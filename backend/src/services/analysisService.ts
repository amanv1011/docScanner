import crypto from 'node:crypto';
import { documentRepo, analysisRepo } from '../db/database.js';
import { analyzeDocuments } from './aiService.js';
import { AnalysisRecord, AnalysisResult } from '../types/index.js';

export async function runAnalysis(
  documentIds: string[],
  userPrompt: string
): Promise<AnalysisRecord> {
  if (!documentIds || documentIds.length === 0) {
    throw new Error('Please select or upload at least one document to analyze.');
  }

  const prompt = userPrompt.trim() || 'Provide a comprehensive comparison, factual summary, key metrics, and discrepancy analysis across these documents.';

  // Retrieve documents from SQLite
  const documents = documentRepo.getByIds(documentIds);

  if (documents.length === 0) {
    throw new Error('None of the requested documents were found in the database.');
  }

  const startTime = Date.now();
  const { result, modelUsed } = await analyzeDocuments({
    documents,
    prompt,
  });
  const executionTimeMs = Date.now() - startTime;

  const analysisRecord: AnalysisRecord = {
    id: `analysis-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    prompt,
    documentIds: documents.map((d) => d.id),
    documentNames: documents.map((d) => d.originalName),
    result,
    modelUsed,
    executionTimeMs,
    createdAt: new Date().toISOString(),
  };

  // Persist analysis history in SQLite
  analysisRepo.save(analysisRecord);

  return analysisRecord;
}

export function getAnalysisHistory(): AnalysisRecord[] {
  return analysisRepo.getAll();
}

export function getAnalysisById(id: string): AnalysisRecord | null {
  return analysisRepo.getById(id);
}

export function deleteAnalysis(id: string): boolean {
  return analysisRepo.delete(id);
}
