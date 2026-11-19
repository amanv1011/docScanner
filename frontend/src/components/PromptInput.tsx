import React from 'react';
import { Send, Sparkles, MessageSquareCode, Loader2 } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  selectedDocCount: number;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  setPrompt,
  onAnalyze,
  isAnalyzing,
  selectedDocCount,
}) => {
  const promptSuggestions = [
    {
      label: 'Financial & KPI Comparison',
      text: 'Compare revenue, gross margin, operating expenses, and customer churn metrics across all documents. Identify all notable changes.',
    },
    {
      label: 'Discrepancies & Contradictions',
      text: 'Detect any conflicting disclosures, metric divergences, timeline mismatches, or broken targets between the documents.',
    },
    {
      label: 'Omissions & Missing Info',
      text: 'Identify critical information, risk factors, or methodological footnotes that are missing from each document.',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MessageSquareCode className="w-4 h-4 text-brand-600" />
          3. Analysis Prompt & Instructions
        </h2>
        <span className="text-xs text-slate-500">
          Targeting <strong className="text-slate-800">{selectedDocCount}</strong> selected document{selectedDocCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Prompts:
        </span>
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setPrompt(item.text)}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 border border-slate-200 hover:border-brand-200 transition"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Compare financial performance, operational metrics, and contract terms. Identify discrepancies, factual claims vs interpretations, and evidence..."
          className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-y font-sans"
        />

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Prompt will be dispatched alongside boundary-isolated document representations.
          </p>

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || selectedDocCount === 0}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-brand-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Intelligence Engine...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Analyze Documents</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
