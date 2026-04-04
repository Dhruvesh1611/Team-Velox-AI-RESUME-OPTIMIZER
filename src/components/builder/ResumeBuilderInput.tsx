"use client";

import { useState } from "react";
import { Link2, Briefcase, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { SubmitMorphingButton } from "../watermelon-ui/submit-morphing-button";
import TemplateSelector from "./TemplateSelector";

interface ResumeBuilderInputProps {
  onSubmit: (portfolioUrl: string, jobDescription: string, templateId: string) => void;
  loading: boolean;
}

export default function ResumeBuilderInput({ onSubmit, loading }: ResumeBuilderInputProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [url, setUrl] = useState("");
  const [templateId, setTemplateId] = useState("classic");
  const [jobDesc, setJobDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  function isValidUrl(val: string) {
    try { new URL(val); return true; } catch { return false; }
  }

  function goToStep2() {
    setError(null);
    if (!url.trim() || !isValidUrl(url.trim())) {
      setError("Please enter a valid URL (e.g. https://github.com/yourusername).");
      return;
    }
    setStep(2);
  }

  function goToStep3() {
    setStep(3);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (jobDesc.trim().length < 50) {
      setError("Please paste at least 50 characters of the job description.");
      return;
    }
    onSubmit(url.trim(), jobDesc.trim(), templateId);
  }

  const STEP_LABELS = ["Portfolio URL", "Choose Template", "Job Description"];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive ? "bg-indigo-600 text-white" :
                isDone ? "bg-emerald-100 text-emerald-700 border border-emerald-300" :
                "bg-slate-100 text-slate-400"
              }`}>
                <span className="font-bold">{num}.</span>
                <span>{label}</span>
              </div>
              {i < 2 && <ChevronRight size={14} className="text-slate-300" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: URL ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Link2 size={14} className="text-indigo-500" />
                Portfolio / Profile URL <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goToStep2()}
              placeholder="https://github.com/yourusername  ·  or  ·  https://yourportfolio.dev"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300 disabled:opacity-60"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {["https://github.com/yourusername", "https://yourportfolio.dev", "https://linkedin.com/in/you"].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setUrl(ex)}
                  className="text-[11px] text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              🔍 For GitHub: we deep-scan all repos, README files, languages + stars automatically
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={goToStep2}
              disabled={!isValidUrl(url.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Next: Choose Template <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Template ── */}
      {step === 2 && (
        <div className="space-y-4">
          <TemplateSelector selectedId={templateId} onSelect={setTemplateId} />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 transition-all"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={goToStep3}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
            >
              Next: Job Description <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Job Description ── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-indigo-500" />
                Job Description <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={10}
              disabled={loading}
              placeholder={`Paste the full job description here...\n\nExample:\nWe are looking for a Senior Frontend Engineer proficient in React, TypeScript, and Next.js.\nResponsibilities: Build performant UIs, collaborate with design team...\nRequirements: 3+ years experience, REST API integration, CI/CD...`}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300 disabled:opacity-60"
            />
            <span className="absolute bottom-3 right-4 text-[11px] text-slate-400 font-mono">
              {jobDesc.length} chars
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Summary of choices */}
          <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <p>📎 Portfolio: <span className="font-mono text-slate-700">{url}</span></p>
            <p>🎨 Template: <span className="font-semibold text-slate-700 capitalize">{templateId}</span></p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 transition-all"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <SubmitMorphingButton
              loading={loading}
              disabled={jobDesc.trim().length < 50}
            />
          </div>
        </form>
      )}
    </div>
  );
}
