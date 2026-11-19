import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  AlertTriangle,
  HelpCircle,
  Table as TableIcon,
  BookOpen,
  FileSearch,
  ExternalLink,
  Clock,
  Cpu,
  Quote,
} from 'lucide-react';
import { AnalysisResult, FindingCategory } from '../types/index.js';

interface AnalysisResultsProps {
  result: AnalysisResult;
  modelUsed: string;
  executionTimeMs: number;
  prompt: string;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  modelUsed,
  executionTimeMs,
  prompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'comparisons' | 'findings' | 'discrepancies' | 'missing' | 'sources'>('all');
  const [findingFilter, setFindingFilter] = useState<'all' | FindingCategory>('all');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = () => {
    const markdown = generateMarkdownReport(result, prompt, modelUsed, executionTimeMs);
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `analysis-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredFindings = result.keyFindings.filter((f) => {
    if (findingFilter === 'all') return true;
    return f.category === findingFilter;
  });

  // Extract all unique documents present in comparisons
  const comparisonDocHeaders = Array.from(
    new Set(result.comparisons.flatMap((c) => Object.keys(c.documentValues)))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Intelligence Analysis Report
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
              Generated
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-brand-600" />
              {modelUsed}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {(executionTimeMs / 1000).toFixed(2)}s
            </span>
            <span>•</span>
            <span>{result.sourceReferences.length} source file(s) referenced</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied Markdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Results</span>
              </>
            )}
          </button>

          <button
            onClick={downloadJson}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Sections
        </button>
        <button
          onClick={() => setActiveTab('comparisons')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'comparisons'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Comparisons ({result.comparisons.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'findings'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Key Findings ({result.keyFindings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'discrepancies'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Discrepancies ({result.discrepancies.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'missing'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Missing Info ({result.missingInformation.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'sources'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSearch className="w-3.5 h-3.5" />
          <span>Source References ({result.sourceReferences.length})</span>
        </button>
      </div>

      {/* 1. Executive Summary */}
      {(activeTab === 'all' || activeTab === 'comparisons') && (
        <section className="bg-gradient-to-r from-slate-50 to-brand-50/30 rounded-xl p-4 border border-slate-200">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-brand-600" />
            Executive Synthesis & Summary
          </h3>
          <p className="text-sm text-slate-800 leading-relaxed font-normal">
            {result.summary}
          </p>
        </section>
      )}

      {/* 2. Structured Comparisons Table */}
      {(activeTab === 'all' || activeTab === 'comparisons') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-brand-600" />
              Cross-Document Comparison Matrix
            </h3>
            <span className="text-xs text-slate-500">
              {result.comparisons.length} core parameters compared
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-1/4">Metric / Dimension</th>
                  {comparisonDocHeaders.map((docName, idx) => (
                    <th key={idx} className="py-3 px-4 text-slate-800 font-bold">
                      {docName}
                    </th>
                  ))}
                  <th className="py-3 px-4 w-1/4">Analytical Commentary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.comparisons.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/40">
                      {row.metric}
                    </td>
                    {comparisonDocHeaders.map((docName, dIdx) => (
                      <td key={dIdx} className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                        {row.documentValues[docName] || (
                          <span className="text-slate-400 italic">Not Disclosed</span>
                        )}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-slate-600 leading-normal">
                      {row.commentary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Key Findings (with Fact vs Interpretation & Evidence) */}
      {(activeTab === 'all' || activeTab === 'findings') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Key Findings & Source Attribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every finding isolates its source document and explicitly separates extracted facts from analytical interpretations.
              </p>
            </div>

            {/* Filter Facts vs Interpretation */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setFindingFilter('all')}
                className={`px-2 py-0.5 rounded font-medium ${
                  findingFilter === 'all' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
                }`}
              >
                All ({result.keyFindings.length})
              </button>
              <button
                onClick={() => setFindingFilter('fact')}
                className={`px-2 py-0.5 rounded font-medium ${
                  findingFilter === 'fact' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500'
                }`}
              >
                Facts ({result.keyFindings.filter((f) => f.category === 'fact').length})
              </button>
              <button
                onClick={() => setFindingFilter('interpretation')}
                className={`px-2 py-0.5 rounded font-medium ${
                  findingFilter === 'interpretation' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
                }`}
              >
                Interpretations ({result.keyFindings.filter((f) => f.category === 'interpretation').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredFindings.map((finding) => {
              const isFact = finding.category === 'fact';
              const isEvidenceExpanded = !!expandedEvidence[finding.id];

              return (
                <div
                  key={finding.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header Chips */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[200px]" title={finding.sourceDocument}>
                        📄 {finding.sourceDocument}
                      </span>

                      {isFact ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Extracted Fact
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          AI Interpretation
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mb-1">
                      {finding.title}
                    </h4>

                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      {finding.finding}
                    </p>
                  </div>

                  {/* Evidence Drawer */}
                  {finding.evidence && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleEvidence(finding.id)}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                      >
                        <Quote className="w-3 h-3" />
                        <span>{isEvidenceExpanded ? 'Hide Supporting Evidence' : 'Show Supporting Evidence'}</span>
                      </button>

                      {isEvidenceExpanded && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono italic">
                          "{finding.evidence}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Discrepancies & Contradictions */}
      {(activeTab === 'all' || activeTab === 'discrepancies') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Discrepancies & Inconsistencies Detected
            </h3>
            <span className="text-xs text-slate-500">
              {result.discrepancies.length} discrepancy record(s)
            </span>
          </div>

          <div className="space-y-2.5">
            {result.discrepancies.map((disc) => {
              const severityColor =
                disc.severity === 'high'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : disc.severity === 'medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <div
                  key={disc.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-start justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityColor}`}>
                        {disc.severity} severity
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">
                        {disc.topic}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {disc.explanation}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-wrap md:flex-col gap-1 items-start">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Involved Docs:
                    </span>
                    {disc.documentsInvolved.map((doc, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Missing Information */}
      {(activeTab === 'all' || activeTab === 'missing') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Information Gaps & Missing Disclosures
            </h3>
            <span className="text-xs text-slate-500">
              {result.missingInformation.length} omission item(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.missingInformation.map((item) => (
              <div
                key={item.id}
                className="border border-purple-100 bg-purple-50/30 rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 px-2 py-0.5 rounded bg-purple-100/60 font-mono">
                    {item.document}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-purple-600">
                    Omission
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  {item.whatIsMissing}
                </h4>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-700">Analytical Impact:</strong> {item.impact}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Source Document References & Excerpts */}
      {(activeTab === 'all' || activeTab === 'sources') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-brand-600" />
              Source Document Verification & Corpus Inventory
            </h3>
            <span className="text-xs text-slate-500">
              Verified {result.sourceReferences.length} boundary contexts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.sourceReferences.map((ref, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="truncate max-w-[180px]" title={ref.documentName}>
                    {ref.documentName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {ref.totalChars.toLocaleString()} chars (~{ref.tokenEstimate} tok)
                  </span>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-600 font-mono">
                  "{ref.excerpt}"
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

function generateMarkdownReport(
  result: AnalysisResult,
  prompt: string,
  model: string,
  executionMs: number
): string {
  let md = `# Multi-Document Intelligence Analysis Report\n\n`;
  md += `**Execution Time:** ${(executionMs / 1000).toFixed(2)}s | **Engine:** ${model}\n`;
  md += `**User Prompt:** ${prompt}\n\n`;

  md += `## 1. Executive Summary\n${result.summary}\n\n`;

  md += `## 2. Cross-Document Comparisons\n\n`;
  const headers = Array.from(
    new Set(result.comparisons.flatMap((c) => Object.keys(c.documentValues)))
  );
  md += `| Metric | ${headers.join(' | ')} | Commentary |\n`;
  md += `| --- | ${headers.map(() => '---').join(' | ')} | --- |\n`;
  for (const c of result.comparisons) {
    const vals = headers.map((h) => c.documentValues[h] || 'N/A').join(' | ');
    md += `| **${c.metric}** | ${vals} | ${c.commentary} |\n`;
  }
  md += `\n`;

  md += `## 3. Key Findings (Fact vs. Interpretation)\n\n`;
  for (const f of result.keyFindings) {
    md += `### [${f.category.toUpperCase()}] ${f.title}\n`;
    md += `- **Source Document:** ${f.sourceDocument}\n`;
    md += `- **Finding:** ${f.finding}\n`;
    if (f.evidence) {
      md += `- **Evidence:** \`${f.evidence}\`\n`;
    }
    md += `\n`;
  }

  md += `## 4. Discrepancies & Inconsistencies\n\n`;
  for (const d of result.discrepancies) {
    md += `- **[${d.severity.toUpperCase()} SEVERITY] ${d.topic}**\n`;
    md += `  - Documents: ${d.documentsInvolved.join(', ')}\n`;
    md += `  - Explanation: ${d.explanation}\n\n`;
  }

  md += `## 5. Missing Information\n\n`;
  for (const m of result.missingInformation) {
    md += `- **${m.document}:** ${m.whatIsMissing} *(Impact: ${m.impact})*\n`;
  }
  md += `\n`;

  md += `## 6. Source References\n\n`;
  for (const s of result.sourceReferences) {
    md += `- **${s.documentName}** (${s.totalChars} chars, ~${s.tokenEstimate} tokens): "${s.excerpt}"\n`;
  }

  return md;
}
