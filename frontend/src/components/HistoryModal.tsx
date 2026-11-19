import React from 'react';
import { X, History, Trash2, ArrowUpRight, Clock, Cpu, FileText } from 'lucide-react';
import { AnalysisRecord } from '../types/index.js';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onDeleteRecord,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">
              Analysis History (SQLite Persistence)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No previous analyses recorded.</p>
              <p className="text-xs text-slate-400 mt-1">Run an analysis to persist records in SQLite.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-brand-300 hover:bg-brand-50/20 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-brand-600" />
                      {item.modelUsed}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 line-clamp-2 mb-2">
                    "{item.prompt}"
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] text-slate-400 font-medium">Docs:</span>
                    {item.documentNames.map((name, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(item.executionTimeMs / 1000).toFixed(2)}s runtime
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onDeleteRecord(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete record from SQLite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectRecord(item);
                        onClose();
                      }}
                      className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <span>Load Analysis</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{history.length} analysis run(s) saved</span>
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
