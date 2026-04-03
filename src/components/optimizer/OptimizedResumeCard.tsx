"use client";

import { useState } from "react";
import { Wand2, Copy, CheckCheck, FileText } from "lucide-react";

interface OptimizedResumeCardProps {
  optimizedResume: string;
}

export default function OptimizedResumeCard({ optimizedResume }: OptimizedResumeCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(optimizedResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-slide-up delay-100">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Wand2 size={14} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Optimized Resume</h2>
            <p className="text-xs text-slate-500">Rewritten by Groq · llama-3.3-70b</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
            <FileText size={10} className="inline mr-1" />
            {optimizedResume.length.toLocaleString()} chars
          </span>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              copied
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
            }`}
          >
            {copied ? (
              <>
                <CheckCheck size={13} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <div className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-4 max-h-[480px] overflow-y-auto">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
            {optimizedResume}
          </pre>
        </div>
      </div>
    </div>
  );
}
