"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { SubmitMorphingButton } from "../watermelon-ui/submit-morphing-button";

interface ResumeInputProps {
  onSubmit: (resumeText: string, file?: string) => void;
  loading: boolean;
}

export default function ResumeInput({ onSubmit, loading }: ResumeInputProps) {
  const [text, setText] = useState("");
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
    if (trimmed.length < 50) {
      setError("Please paste at least 50 characters of resume text.");
      return;
    }
    onSubmit(trimmed, fileBase64);
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
          Resume Text <span className="text-red-500">*</span>
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
          disabled={text.trim().length < 50}
        />
      </div>
    </form>
  );
}
