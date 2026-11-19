import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => Promise<void>;
  onLoadSamples: () => Promise<void>;
  isUploading: boolean;
  isLoadingSamples: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onLoadSamples,
  isUploading,
  isLoadingSamples,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.pdf', '.txt', '.csv', '.md'];

  const validateAndUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        setErrorMsg(`"${file.name}" has an unsupported format. Please upload PDF, TXT, or CSV files.`);
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" exceeds 15 MB limit.`);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesUploaded(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-brand-600" />
            1. Document Ingestion
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload multiple documents (PDF, TXT, CSV) to analyze and cross-reference.
          </p>
        </div>

        {/* Load Samples Quick Button */}
        <button
          onClick={onLoadSamples}
          disabled={isLoadingSamples || isUploading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition shadow-xs disabled:opacity-50"
        >
          {isLoadingSamples ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span>Load Synthetic Samples</span>
        </button>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-brand-400 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.csv,.md"
          className="hidden"
          onChange={(e) => validateAndUpload(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <span className="text-sm font-semibold text-brand-700 hover:underline">
              {isUploading ? 'Extracting & parsing text...' : 'Click to select documents'}
            </span>
            <span className="text-sm text-slate-500"> or drag & drop files here</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
            <span className="px-2 py-0.5 rounded bg-slate-200/60 text-slate-600">PDF (pdf-parse)</span>
            <span className="px-2 py-0.5 rounded bg-slate-200/60 text-slate-600">TXT (Plain text)</span>
            <span className="px-2 py-0.5 rounded bg-slate-200/60 text-slate-600">CSV (Tabular schema)</span>
            <span>• Max 15 MB / file</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
