"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/landing/hero";
import ResumeInput from "../components/optimizer/ResumeInput";
import AnalysisCard from "../components/optimizer/AnalysisCard";
import OptimizedResumeCard from "../components/optimizer/OptimizedResumeCard";
import ReviewScoreCard from "../components/optimizer/ReviewScoreCard";
import HistoryList from "../components/optimizer/HistoryList";
import { RunActionButton } from "../components/watermelon-ui/run-action-button";
import { ContinuousTabs } from "../components/watermelon-ui/continuous-tabs";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Wand2,
  ClipboardPaste,
  SearchCheck,
  Rocket,
  Trophy,
  Star,
  Zap,
  FileText,
  Target,
  Shield,
  CheckCircle,
  BarChart3,
  Award,
} from "lucide-react";
import {
  FaInbox,
  FaMagnifyingGlass,
  FaWandMagicSparkles,
  FaAward,
} from "react-icons/fa6";
import { BsFileTextFill } from "react-icons/bs";
import { TbClockHour12Filled } from "react-icons/tb";

interface PipelineResult {
  fileUrl: string | null;
  analysis: {
    skills: string[];
    weak_points: string[];
    missing_metrics: string[];
    keyword_gaps: string[];
    structure_issues: string[];
  };
  optimizedResume: string;
  review: {
    improvement_score: number;
    clarity_improvement: string;
    impact_improvement: string;
    keyword_relevance: string;
    final_summary: string;
  };
  runId: string | null;
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste Your Resume",
    desc: "Copy & paste your raw resume text (or upload a PDF). No formatting needed.",
    icon: ClipboardPaste,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100",
  },
  {
    step: "02",
    title: "AI Analyzes It",
    desc: "Groq's llama-3.3-70b extracts skills, spots weak phrasing & keyword gaps.",
    icon: SearchCheck,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    step: "03",
    title: "Gets Optimized",
    desc: "Our Optimizer agent rewrites it for clarity, ATS compliance & impact.",
    icon: Rocket,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
  },
  {
    step: "04",
    title: "Reviewed & Scored",
    desc: "HuggingFace's gpt-oss-120b reviews the result and gives a quality score.",
    icon: Trophy,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
  },
];

const PIPELINE_STEPS = [
  { id: 1, label: "Uploading Resume", icon: FaInbox },
  { id: 2, label: "Analyzing Content", icon: FaMagnifyingGlass },
  { id: 3, label: "Building Profile", icon: BsFileTextFill },
  { id: 4, label: "Optimizing Resume", icon: FaWandMagicSparkles },
  { id: 5, label: "Reviewing Quality", icon: TbClockHour12Filled },
  { id: 6, label: "Scoring Results", icon: FaAward },
];

const RESULT_TABS = [
  { id: "analysis", label: "Analysis" },
  { id: "optimized", label: "Optimized" },
  { id: "review", label: "Review Score" },
];

const WHY_HIRELENS = [
  {
    icon: Target,
    title: "ATS-Optimized Output",
    desc: "Every resume is tailored to pass Applicant Tracking Systems. We match keywords, format structure, and optimize readability for automated scanners.",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: Shield,
    title: "Accurate & Real Data",
    desc: "We don't fabricate content. Our AI extracts real projects, skills, and achievements from your portfolio and enhances them — nothing made up.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: BarChart3,
    title: "High ATS Score Guaranteed",
    desc: "Our multi-agent pipeline ensures your resume scores 85+ on ATS checkers. We optimize for keyword density, formatting, and professional impact.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: Award,
    title: "AI-Reviewed Quality",
    desc: "Every generated resume is reviewed by a second AI agent that checks for clarity, impact, and completeness — like having a peer review built in.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(resumeText: string, file?: string) {
    setApiError(null);
    setResult(null);
    setLoading(true);

    try {
      const body: { resumeText: string; file?: string } = { resumeText };
      if (file) body.file = file;

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Pipeline failed.");

      setResult(data as PipelineResult);
      setActiveTab("analysis");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-40" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold mb-6 animate-fade-in">
            <Sparkles size={12} />
            Multi-Agent AI Pipeline · 3 Models
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-5 animate-fade-in delay-100">
            Land Your Dream Job{" "}
            <span className="gradient-text">with AI-Powered</span>
            <br />
            Resume Optimization
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in delay-200">
            Our 3-agent pipeline analyzes your resume, rewrites it for ATS & clarity,
            then scores the improvements — all in seconds.
          </p>

          {/* ── Two Highlighted Feature Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12 animate-fade-in delay-300">
            {/* Resume Builder Card */}
            <Link href="/builder" className="group relative">
              <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8 text-left transition-all hover:shadow-xl hover:shadow-violet-100 hover:border-violet-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100 rounded-full blur-2xl opacity-50 -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
                    <Zap size={22} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Resume Builder
                    <span className="ml-2 text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                      1-Click
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Paste your portfolio link & job description — AI builds a professional,
                    ATS-optimized resume from your real projects & skills.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 group-hover:gap-3 transition-all">
                    Build Now <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>

            {/* Resume Optimizer Card */}
            <a href="#optimizer" className="group relative">
              <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 text-left transition-all hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50 -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                    <Sparkles size={22} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Resume Optimizer
                    <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      AI Pipeline
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Paste your existing resume — our 3-agent pipeline analyzes, rewrites,
                    and scores it for maximum ATS compliance and impact.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">
                    Optimize Now <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-6 animate-fade-in delay-400">
            {[
              { label: "AI Agents", value: "3×", icon: Brain },
              { label: "Avg. Score Boost", value: "68pts", icon: Star },
              { label: "Models Used", value: "Groq + HF", icon: Wand2 },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl px-4 py-2.5 border border-slate-200 shadow-sm"
              >
                <Icon size={14} className="text-indigo-500" />
                <span className="font-bold text-slate-900">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why HireLens ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
            Why Choose Us
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Not Just Another Resume Tool
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            We don&apos;t just slap keywords onto your resume. Our AI deeply analyzes your real
            portfolio data and crafts accurate, ATS-beating resumes with genuine achievements.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {WHY_HIRELENS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`rounded-2xl border ${item.border} ${item.bg} p-6 hover:shadow-md transition-all animate-slide-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border ${item.border} flex-shrink-0`}>
                    <Icon size={18} className={item.color} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1.5">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
          {[
            { icon: CheckCircle, label: "Real data from your portfolio" },
            { icon: Shield, label: "No fabricated content" },
            { icon: Target, label: "85+ ATS score average" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={15} className="text-emerald-500" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
              The Process
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
              <div
                key={item.step}
                className="bg-[#f8fafc] rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg} mb-3`}>
                  <Icon size={20} className={item.iconColor} />
                </div>
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">
                  Step {item.step}
                </p>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* ── Optimizer ── */}
      <section id="optimizer" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/30">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">
              AI Resume Optimizer
            </p>
            <h2 className="text-xl font-bold text-slate-900">Optimize Your Resume</h2>
            <p className="text-sm text-slate-500 mt-1">
              Paste your resume text below and our 3-agent AI pipeline will analyze, rewrite,
              and score it.
            </p>
          </div>

          <div className="p-8">
            <ResumeInput onSubmit={handleSubmit} loading={loading} />
          </div>

          {loading && (
            <div className="px-8 pb-8 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                Running AI Pipeline
              </p>
              <RunActionButton steps={PIPELINE_STEPS} />
            </div>
          )}

          {apiError && (
            <div className="mx-8 mb-8 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
              ⚠️ {apiError}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="mt-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 px-2">
                Results
              </p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex justify-center">
              <ContinuousTabs
                tabs={RESULT_TABS}
                defaultActiveId="analysis"
                onChange={(id) => setActiveTab(id)}
              />
            </div>

            <div className="mt-6">
              {activeTab === "analysis" && (
                <AnalysisCard analysis={result.analysis} />
              )}
              {activeTab === "optimized" && (
                <OptimizedResumeCard optimizedResume={result.optimizedResume} />
              )}
              {activeTab === "review" && (
                <ReviewScoreCard review={result.review} />
              )}
            </div>

            {result.fileUrl && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                ✅ Resume uploaded to Cloudinary:{" "}
                <a
                  href={result.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium hover:text-emerald-900"
                >
                  View file
                </a>
              </div>
            )}

            {result.runId && (
              <p className="text-xs text-slate-400 font-mono">
                Run ID: {result.runId}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── History ── */}
      <div className="bg-white border-t border-slate-100">
        <HistoryList />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="font-medium text-slate-600">HireLens</span> · AI
            Resume Optimizer
          </div>
          <p>Built by Team Velox · CHARUSAT</p>
          <p>Powered by Groq · HuggingFace · Cloudinary · MongoDB</p>
        </div>
      </footer>
    </div>
  );
}
