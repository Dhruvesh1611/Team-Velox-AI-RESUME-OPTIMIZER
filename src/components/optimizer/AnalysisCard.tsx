"use client";

import { useState } from "react";
import {
  Brain,
  AlertTriangle,
  BarChart2,
  Hash,
  Layout,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ResumeAnalysis {
  skills: string[];
  weak_points: string[];
  missing_metrics: string[];
  keyword_gaps: string[];
  structure_issues: string[];
}

interface AnalysisCardProps {
  analysis: ResumeAnalysis;
}

const SECTIONS = [
  {
    key: "skills" as keyof ResumeAnalysis,
    label: "Skills Detected",
    icon: Brain,
    color: "indigo",
    badgeStyle: "bg-indigo-100 text-indigo-700 border-indigo-200",
    headerStyle: "text-indigo-700",
  },
  {
    key: "weak_points" as keyof ResumeAnalysis,
    label: "Weak Points",
    icon: AlertTriangle,
    color: "amber",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
    headerStyle: "text-amber-700",
  },
  {
    key: "missing_metrics" as keyof ResumeAnalysis,
    label: "Missing Metrics",
    icon: BarChart2,
    color: "orange",
    badgeStyle: "bg-orange-50 text-orange-700 border-orange-200",
    headerStyle: "text-orange-700",
  },
  {
    key: "keyword_gaps" as keyof ResumeAnalysis,
    label: "Keyword Gaps",
    icon: Hash,
    color: "violet",
    badgeStyle: "bg-violet-50 text-violet-700 border-violet-200",
    headerStyle: "text-violet-700",
  },
  {
    key: "structure_issues" as keyof ResumeAnalysis,
    label: "Structure Issues",
    icon: Layout,
    color: "rose",
    badgeStyle: "bg-rose-50 text-rose-700 border-rose-200",
    headerStyle: "text-rose-700",
  },
];

function Section({
  section,
  items,
}: {
  section: (typeof SECTIONS)[0];
  items: string[];
}) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className={section.headerStyle} />
          <span className="text-sm font-semibold text-slate-700">{section.label}</span>
          <span className="text-xs font-medium text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-slate-400" />
        ) : (
          <ChevronDown size={14} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-4 py-3 bg-white">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic">None found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((item, i) => (
                <span
                  key={i}
                  className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg border ${section.badgeStyle}`}
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-slide-up">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Brain size={14} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Resume Analysis</h2>
            <p className="text-xs text-slate-500">Powered by Groq · llama-3.3-70b</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-3">
        {SECTIONS.map((section) => (
          <Section
            key={section.key}
            section={section}
            items={analysis[section.key]}
          />
        ))}
      </div>
    </div>
  );
}
