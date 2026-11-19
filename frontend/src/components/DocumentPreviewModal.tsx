import React from 'react';
import { X, FileText, Copy, Check } from 'lucide-react';
import { DocumentItem } from '../types/index.js';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!document) return null;

  const copyText = () => {
    if (document.extractedText) {
      navigator.clipboard.writeText(document.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                {document.originalName}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {document.charCount.toLocaleString()} chars • ~{document.tokenEstimate} tokens • {document.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyText}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Text View Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed selection:bg-brand-500 selection:text-white">
          <pre className="whitespace-pre-wrap font-mono">
            {document.extractedText || 'No text extracted.'}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Boundary Status: Isolated & Verified</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
