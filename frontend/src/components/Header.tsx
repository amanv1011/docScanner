import React from 'react';
import { Layers, History, Cpu, FileText } from 'lucide-react';

interface HeaderProps {
  aiMode: string;
  onOpenHistory: () => void;
  historyCount: number;
  totalDocs: number;
}

export const Header: React.FC<HeaderProps> = ({
  aiMode,
  onOpenHistory,
  historyCount,
  totalDocs,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Multi-Document Intelligence Workbench
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                MVP v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cross-document comparative intelligence, boundary-isolated reasoning & source attribution
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active AI Engine Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <Cpu className="w-4 h-4 text-brand-600 animate-pulse" />
            <span className="text-slate-600 font-medium">Engine:</span>
            <span className="font-semibold text-slate-800">{aiMode || 'Dynamic Fallback Engine'}</span>
          </div>

          {/* Document Count */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{totalDocs} doc{totalDocs !== 1 ? 's' : ''} in workspace</span>
          </div>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-xs font-semibold transition-colors shadow-sm"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-brand-100 text-brand-700 rounded-full text-[10px] font-bold">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
