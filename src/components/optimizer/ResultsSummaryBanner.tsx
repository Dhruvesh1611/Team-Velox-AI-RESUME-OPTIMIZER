"use client";

import { Target, TrendingUp, Sparkles, Mic2 } from "lucide-react";

interface ResultsSummaryBannerProps {
  improvementScore: number;
  placementReadiness: number;
  jobTargeted: boolean;
  onGoInterview: () => void;
}

export default function ResultsSummaryBanner({
  improvementScore,
  placementReadiness,
  jobTargeted,
  onGoInterview,
}: ResultsSummaryBannerProps) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/50 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <TrendingUp className="text-white" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">
                Optimization lift
              </p>
              <p className="text-2xl font-bold text-slate-900">{improvementScore}</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-indigo-100" aria-hidden />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
              <Sparkles className="text-white" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
                Readiness (estimate)
              </p>
              <p className="text-2xl font-bold text-slate-900">{placementReadiness}</p>
            </div>
          </div>
          {jobTargeted && (
            <>
              <div className="hidden sm:block w-px h-12 bg-indigo-100" aria-hidden />
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-800 text-sm font-medium">
                <Target size={16} className="text-indigo-600 flex-shrink-0" />
                Tailored to your job description
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onGoInterview}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Mic2 size={18} />
          Mock interview prep
        </button>
      </div>
    </div>
  );
}
