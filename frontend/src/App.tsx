import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { FileUpload } from './components/FileUpload.js';
import { DocumentList } from './components/DocumentList.js';
import { PromptInput } from './components/PromptInput.js';
import { AnalysisResults } from './components/AnalysisResults.js';
import { DocumentPreviewModal } from './components/DocumentPreviewModal.js';
import { HistoryModal } from './components/HistoryModal.js';
import {
  fetchHealth,
  fetchDocuments,
  fetchDocumentById,
  uploadDocuments,
  deleteDocument,
  loadSampleDocuments,
  runAnalysis,
  fetchHistory,
  deleteAnalysis,
} from './api/client.js';
import { DocumentItem, AnalysisRecord } from './types/index.js';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const [aiMode, setAiMode] = useState<string>('Detecting...');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>(
    'Compare quarterly performance, financial metrics, and operational headcount across all reports. Identify factual disclosures, AI interpretations, discrepancies, and missing information.'
  );

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize
  useEffect(() => {
    loadInitialData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadInitialData = async () => {
    try {
      const health = await fetchHealth();
      setAiMode(health.aiMode);

      const docs = await fetchDocuments();
      setDocuments(docs);
      setSelectedDocIds(docs.map((d) => d.id));

      const hist = await fetchHistory();
      setHistory(hist);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setAiMode('Offline / Error');
    }
  };

  const handleFilesUploaded = async (files: File[]) => {
    try {
      setIsUploading(true);
      const res = await uploadDocuments(files);
      const updatedDocs = await fetchDocuments();
      setDocuments(updatedDocs);
      // Automatically select newly uploaded docs
      const newIds = res.documents.map((d) => d.id);
      setSelectedDocIds((prev) => Array.from(new Set([...prev, ...newIds])));
      showToast(`Uploaded and parsed ${res.documents.length} document(s) successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSamples = async () => {
    try {
      setIsLoadingSamples(true);
      const res = await loadSampleDocuments();
      const updatedDocs = await fetchDocuments();
      setDocuments(updatedDocs);
      setSelectedDocIds(updatedDocs.map((d) => d.id));
      showToast(`Loaded ${res.documents.length} synthetic sample documents!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to load samples', 'error');
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
      showToast('Document removed from workspace.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'error');
    }
  };

  const handlePreviewDocument = async (doc: DocumentItem) => {
    try {
      // Fetch full extracted text
      const full = await fetchDocumentById(doc.id);
      setPreviewDoc(full);
    } catch (err) {
      setPreviewDoc(doc);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocIds.length === documents.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map((d) => d.id));
    }
  };

  const handleRunAnalysis = async () => {
    if (selectedDocIds.length === 0) {
      showToast('Please select at least one document to analyze.', 'error');
      return;
    }

    try {
      setIsAnalyzing(true);
      const analysisRecord = await runAnalysis(selectedDocIds, prompt);
      setCurrentAnalysis(analysisRecord);

      // Refresh history
      const updatedHist = await fetchHistory();
      setHistory(updatedHist);
      showToast('Multi-document analysis completed successfully!');
    } catch (err: any) {
      showToast(err.message || 'Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteAnalysisRecord = async (id: string) => {
    try {
      await deleteAnalysis(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(null);
      }
      showToast('Analysis deleted from SQLite history.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* App Header */}
      <Header
        aiMode={aiMode}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        totalDocs={documents.length}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step 1: File Ingestion */}
        <FileUpload
          onFilesUploaded={handleFilesUploaded}
          onLoadSamples={handleLoadSamples}
          isUploading={isUploading}
          isLoadingSamples={isLoadingSamples}
        />

        {/* Step 2: Documents List with Selection */}
        <DocumentList
          documents={documents}
          selectedDocIds={selectedDocIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onPreview={handlePreviewDocument}
          onDelete={handleDeleteDocument}
        />

        {/* Step 3: Prompt Configuration & Execution */}
        <PromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          onAnalyze={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          selectedDocCount={selectedDocIds.length}
        />

        {/* Step 4: Results Display */}
        {currentAnalysis && (
          <div className="pt-2 animate-in fade-in duration-300">
            <AnalysisResults
              result={currentAnalysis.result}
              modelUsed={currentAnalysis.modelUsed}
              executionTimeMs={currentAnalysis.executionTimeMs}
              prompt={currentAnalysis.prompt}
            />
          </div>
        )}
      </main>

      {/* Extracted Text Inspector Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* SQLite History Drawer / Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={(rec) => setCurrentAnalysis(rec)}
        onDeleteRecord={handleDeleteAnalysisRecord}
      />
    </div>
  );
};
