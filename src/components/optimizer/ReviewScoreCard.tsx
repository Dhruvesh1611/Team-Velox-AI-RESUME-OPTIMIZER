"use client";

import { Star, Zap, Hash, FileCheck2, MessageSquareText, Target, AlertTriangle } from "lucide-react";

interface ResumeReview {
  improvement_score: number;
  clarity_improvement: string;
  impact_improvement: string;
  keyword_relevance: string;
  final_summary: string;
  placement_readiness_score: number;
  placement_summary: string;
  role_strengths: string[];
  role_gaps: string[];
}

interface ReviewScoreCardProps {
  review: ResumeReview;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  const color =
    score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f87171";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </p>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-4xl font-bold text-slate-900">{score}</span>
        <span className="text-xs text-slate-500 font-medium">/ 100</span>
      </div>
    </div>
  );
}

const FIELDS = [
  { key: "clarity_improvement", label: "Clarity", icon: FileCheck2, color: "text-indigo-600 bg-indigo-50" },
  { key: "impact_improvement", label: "Impact", icon: Zap, color: "text-amber-600 bg-amber-50" },
  { key: "keyword_relevance", label: "Keywords", icon: Hash, color: "text-violet-600 bg-violet-50" },
] as const;

export default function ReviewScoreCard({ review }: ReviewScoreCardProps) {
  const score = review.improvement_score;
  const placement = review.placement_readiness_score;
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Needs Work";
  const labelColor =
    score >= 75 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-slide-up delay-200">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <Star size={14} className="text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 text-base">Review Report</h2>
          <p className="text-xs text-slate-500">Optimization quality + readiness estimate</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={score} label="Optimization" />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${labelColor}`}>
              {label} lift
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={placement} label="Readiness" />
            <p className="text-[11px] text-slate-500 text-center max-w-[200px] leading-snug">
              Heuristic only — not a hiring guarantee.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 flex gap-2">
          <Target size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Placement outlook
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{review.placement_summary}</p>
          </div>
        </div>

        {(review.role_strengths.length > 0 || review.role_gaps.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {review.role_strengths.length > 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">
                  Strengths
                </p>
                <ul className="text-sm text-emerald-900 space-y-1.5 list-disc list-inside">
                  {review.role_strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.role_gaps.length > 0 && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Gaps to close
                </p>
                <ul className="text-sm text-amber-950 space-y-1.5 list-disc list-inside">
                  {review.role_gaps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {FIELDS.map(({ key, label: fieldLabel, icon: Icon, color }) => (
            <div key={key} className="flex gap-3">
              <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{fieldLabel}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{review[key]}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-1 border-t border-slate-100">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 bg-slate-100">
              <MessageSquareText size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed">{review.final_summary}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
