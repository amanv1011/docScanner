export interface DocumentRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  charCount: number;
  tokenEstimate: number;
  extractedText: string;
  createdAt: string;
}

export type FindingCategory = 'fact' | 'interpretation';

export interface KeyFinding {
  id: string;
  title: string;
  finding: string;
  sourceDocument: string;
  category: FindingCategory;
  evidence: string;
}

export interface MetricComparison {
  metric: string;
  documentValues: Record<string, string>;
  commentary: string;
}

export interface Discrepancy {
  id: string;
  topic: string;
  documentsInvolved: string[];
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface MissingInformation {
  id: string;
  document: string;
  whatIsMissing: string;
  impact: string;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  totalChars: number;
  tokenEstimate: number;
  excerpt: string;
}

export interface AnalysisResult {
  summary: string;
  keyFindings: KeyFinding[];
  comparisons: MetricComparison[];
  discrepancies: Discrepancy[];
  missingInformation: MissingInformation[];
  sourceReferences: SourceReference[];
}

export interface AnalysisRecord {
  id: string;
  prompt: string;
  documentIds: string[];
  documentNames: string[];
  result: AnalysisResult;
  modelUsed: string;
  executionTimeMs: number;
  createdAt: string;
}

export interface ParseResult {
  text: string;
  charCount: number;
  tokenEstimate: number;
  metadata?: Record<string, any>;
}
