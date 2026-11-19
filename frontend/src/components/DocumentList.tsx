import React from 'react';
import { FileText, Trash2, Eye, CheckSquare, Square, FileSpreadsheet, FileCode } from 'lucide-react';
import { DocumentItem } from '../types/index.js';

interface DocumentListProps {
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onPreview: (doc: DocumentItem) => void;
  onDelete: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocIds,
  onToggleSelect,
  onSelectAll,
  onPreview,
  onDelete,
}) => {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No documents in workspace</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Upload PDF, TXT, or CSV files above, or click "Load Synthetic Samples" to test immediate multi-document intelligence.
        </p>
      </div>
    );
  }

  const allSelected = documents.length > 0 && selectedDocIds.length === documents.length;

  const getDocIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-600" />;
    return <FileCode className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            2. Active Documents ({selectedDocIds.length} of {documents.length} selected)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Boundary-isolated parsed text records ready for prompt analysis.
          </p>
        </div>

        <button
          onClick={onSelectAll}
          className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center space-x-1"
        >
          {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {documents.map((doc) => {
          const isSelected = selectedDocIds.includes(doc.id);
          const sizeKb = (doc.fileSize / 1024).toFixed(1);

          return (
            <div
              key={doc.id}
              className={`relative border rounded-xl p-3.5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/30 shadow-xs ring-1 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className="flex items-center space-x-2 cursor-pointer select-none flex-1 min-w-0"
                    onClick={() => onToggleSelect(doc.id)}
                  >
                    <div className="text-slate-500">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="shrink-0">{getDocIcon(doc.originalName)}</div>
                    <span className="text-xs font-bold text-slate-800 truncate" title={doc.originalName}>
                      {doc.originalName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => onPreview(doc)}
                      title="Inspect extracted text"
                      className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      title="Delete document"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mb-2 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {sizeKb} KB
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {doc.charCount.toLocaleString()} chars
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                    ~{doc.tokenEstimate} tokens
                  </span>
                </div>

                {doc.preview && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                    "{doc.preview}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
