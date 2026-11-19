import { DocumentItem, AnalysisRecord } from '../types/index.js';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; service: string; aiMode: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function uploadDocuments(files: File[]): Promise<{ documents: DocumentItem[]; errors?: any[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload documents');
  }
  return data;
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchDocumentById(id: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch document details');
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function loadSampleDocuments(): Promise<{ documents: DocumentItem[] }> {
  const res = await fetch(`${API_BASE}/documents/load-samples`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load samples');
  return data;
}

export async function runAnalysis(documentIds: string[], prompt: string): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentIds, prompt }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to run analysis');
  }
  return data;
}

export async function fetchHistory(): Promise<AnalysisRecord[]> {
  const res = await fetch(`${API_BASE}/analysis/history`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function deleteAnalysis(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/analysis/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete analysis');
}
