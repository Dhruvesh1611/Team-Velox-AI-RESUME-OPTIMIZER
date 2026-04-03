"use client";

import { Star, Zap, Hash, FileCheck2, MessageSquareText } from "lucide-react";

interface ResumeReview {
  improvement_score: number;
  clarity_improvement: string;
  impact_improvement: string;
  keyword_relevance: string;
  final_summary: string;
}

interface ReviewScoreCardProps {
  review: ResumeReview;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  const color =
    score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f87171";

  return (
    <div className="relative w-36 h-36 mx-auto">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
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
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Needs Work";
  const labelColor =
    score >= 75 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-slide-up delay-200">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <Star size={14} className="text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 text-base">Review Report</h2>
          <p className="text-xs text-slate-500">Powered by HuggingFace · gpt-oss-120b</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Score ring */}
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={score} />
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${labelColor}`}>
            {label} Improvement
          </span>
        </div>

        {/* Detail rows */}
        <div className="grid gap-4">
          {FIELDS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex gap-3">
              <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{review[key]}</p>
              </div>
            </div>
          ))}

          {/* Summary */}
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
