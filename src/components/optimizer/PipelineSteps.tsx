"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "Analyzing", desc: "Extracting skills, weak points & keyword gaps" },
  { id: 2, label: "Optimizing", desc: "Rewriting your resume for clarity & ATS" },
  { id: 3, label: "Reviewing", desc: "Scoring improvements & generating feedback" },
];

interface PipelineStepsProps {
  currentStep: number; // 1 = analyzing, 2 = optimizing, 3 = reviewing, 4 = done
}

export default function PipelineSteps({ currentStep }: PipelineStepsProps) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-6 animate-scale-in">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-5">
        AI Pipeline Progress
      </p>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
        {STEPS.map((step, idx) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div key={step.id} className="flex sm:flex-1 items-start sm:items-center gap-3">
              {/* Node */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:flex-1">
                <div
                  className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : active
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={18} />
                  ) : active ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    step.id
                  )}
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20" />
                  )}
                </div>

                {/* Connector line (except last) */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden sm:block flex-1 h-0.5 mx-2 rounded-full bg-slate-200 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-indigo-400 rounded-full transition-all duration-700"
                      style={{ width: done ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="sm:hidden flex-1">
                <p className={`text-sm font-semibold ${active ? "text-indigo-700" : done ? "text-emerald-700" : "text-slate-400"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step labels on desktop */}
      <div className="hidden sm:flex mt-3">
        {STEPS.map((step) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div key={step.id} className="flex-1 px-1">
              <p className={`text-xs font-semibold text-center ${active ? "text-indigo-700" : done ? "text-emerald-700" : "text-slate-400"}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-slate-400 text-center leading-tight mt-0.5">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
