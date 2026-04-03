"use client";

import { useEffect, useState } from "react";
import { History, ChevronDown, ChevronUp, Clock, Star, Loader2, DatabaseZap } from "lucide-react";

interface ResumeRun {
  id: string;
  resumeText: string;
  optimizedResume: string;
  analysis: {
    skills: string[];
    weak_points: string[];
    missing_metrics: string[];
    keyword_gaps: string[];
    structure_issues: string[];
  };
  review: {
    improvement_score: number;
    clarity_improvement: string;
    impact_improvement: string;
    keyword_relevance: string;
    final_summary: string;
  };
  fileUrl: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : score >= 50 ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <Star size={10} />
      {score}/100
    </span>
  );
}

function RunRow({ run }: { run: ResumeRun }) {
  const [open, setOpen] = useState(false);
  const preview = run.resumeText.slice(0, 120).replace(/\n/g, " ");

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-indigo-200 hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start sm:items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <ScoreBadge score={run.review.improvement_score} />
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock size={10} />
              {formatDate(run.createdAt)}
            </span>
          </div>
          <p className="text-sm text-slate-600 truncate">{preview}…</p>
        </div>
        <div className="flex-shrink-0 text-slate-400">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 space-y-4 animate-fade-in">
          {/* Summary */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">AI Summary</p>
            <p className="text-sm text-slate-700">{run.review.final_summary}</p>
          </div>

          {/* Skills */}
          {run.analysis.skills.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {run.analysis.skills.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Optimized preview */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Optimized Resume (preview)</p>
            <pre className="text-xs text-slate-600 font-mono bg-white rounded-lg border border-slate-100 p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {run.optimizedResume.slice(0, 600)}…
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryList() {
  const [runs, setRuns] = useState<ResumeRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/pipeline?limit=10");
        const data = await res.json();
        if (data.runs) setRuns(data.runs);
      } catch {
        setError("Could not load history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <section id="history" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
          <History size={15} className="text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Previous Runs</h2>
          <p className="text-sm text-slate-500">Your last 10 optimization sessions</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading history…</span>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <DatabaseZap size={28} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No optimizations yet.</p>
          <p className="text-xs mt-1">Submit your first resume above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </div>
      )}
    </section>
  );
}
