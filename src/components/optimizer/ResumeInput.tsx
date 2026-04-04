"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, AlertCircle, Target, Briefcase } from "lucide-react";
import { SubmitMorphingButton } from "../watermelon-ui/submit-morphing-button";

interface ResumeInputProps {
  onSubmit: (
    resumeText: string,
    file?: string,
    fileName?: string,
    jobDescription?: string
  ) => void;
  loading: boolean;
}

export default function ResumeInput({ onSubmit, loading }: ResumeInputProps) {
  const [text, setText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File too large. Max 5MB.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!fileBase64 && trimmed.length < 50) {
      setError("Please paste at least 50 characters of resume text or upload a resume file.");
      return;
    }
    onSubmit(
      trimmed,
      fileBase64,
      fileName ?? undefined,
      jobDescription.trim() || undefined
    );
  }

  function clearFile() {
    setFileName(null);
    setFileBase64(undefined);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Textarea */}
      <div className="relative">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Resume Text <span className="text-slate-400 font-normal">(optional if you upload a file)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder={`Paste your full resume here...\n\nExample:\nJohn Doe\nSoftware Engineer | john@example.com\n\nExperience:\n- Built REST APIs with Node.js...\n- Managed cloud infrastructure on AWS...`}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300"
          disabled={loading}
        />
        <span className="absolute bottom-3 right-4 text-[11px] text-slate-400 font-mono">
          {text.length} chars
        </span>
      </div>

      {/* Target role / JD — surfaced as a primary feature */}
      <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/40 p-5 shadow-sm ring-1 ring-indigo-50">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
            <Target className="text-white" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm font-bold text-slate-900">Job-specific mode</label>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 bg-white/80 border border-indigo-200 px-2 py-0.5 rounded-full">
                <Briefcase size={10} />
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Paste the job posting or role summary. The analyzer, optimizer, and reviewer use it for keyword gaps,
              tailoring, and a role-aware readiness estimate.
            </p>
          </div>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
          placeholder="Example: paste the full job description from the company careers page…"
          className="w-full resize-y rounded-xl border border-indigo-200/80 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-inner"
          disabled={loading}
        />
        <span className="block text-right text-[11px] text-slate-500 font-mono mt-1.5">
          {jobDescription.length} / 12,000 chars
        </span>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Upload Resume File{" "}
          <span className="font-normal text-slate-400">(optional, PDF/DOCX)</span>
        </label>
        {fileName ? (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm">
            <FileText size={14} />
            <span className="font-medium">{fileName}</span>
            <button
              type="button"
              onClick={clearFile}
              className="ml-1 text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <Upload size={14} />
            Choose file
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit — Watermelon Morphing Button */}
      <div className="flex justify-center pt-2">
        <SubmitMorphingButton
          loading={loading}
          disabled={!fileBase64 && text.trim().length < 50}
        />
      </div>
    </form>
  );
}
