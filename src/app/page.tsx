"use client";

import { useState, useRef } from "react";
import Navbar from "../components/landing/hero";
import ResumeInput from "../components/optimizer/ResumeInput";
import AnalysisCard from "../components/optimizer/AnalysisCard";
import OptimizedResumeCard from "../components/optimizer/OptimizedResumeCard";
import ReviewScoreCard from "../components/optimizer/ReviewScoreCard";
import HistoryList from "../components/optimizer/HistoryList";
import { RunActionButton } from "../components/watermelon-ui/run-action-button";
import { ContinuousTabs } from "../components/watermelon-ui/continuous-tabs";
import { PricingWidget } from "../components/watermelon-ui/pricing-widget";
import { RadialCarousel } from "../components/watermelon-ui/radial-carousel";
import ResumeBuilderInput from "../components/builder/ResumeBuilderInput";
import GeneratedResumeCard, { type BuilderResult } from "../components/builder/GeneratedResumeCard";
import { Sparkles, ArrowRight, Brain, Wand2, Star, Zap } from "lucide-react";
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
    icon: "📋",
  },
  {
    step: "02",
    title: "AI Analyzes It",
    desc: "Groq's llama-3.3-70b extracts skills, spots weak phrasing & keyword gaps.",
    icon: "🧠",
  },
  {
    step: "03",
    title: "Gets Optimized",
    desc: "Our Optimizer agent rewrites it for clarity, ATS compliance & impact.",
    icon: "✨",
  },
  {
    step: "04",
    title: "Reviewed & Scored",
    desc: "HuggingFace's gpt-oss-120b reviews the result and gives a quality score.",
    icon: "🏆",
  },
];

// Pipeline steps for the RunActionButton
const PIPELINE_STEPS = [
  { id: 1, label: "Uploading Resume", icon: FaInbox },
  { id: 2, label: "Analyzing Content", icon: FaMagnifyingGlass },
  { id: 3, label: "Building Profile", icon: BsFileTextFill },
  { id: 4, label: "Optimizing Resume", icon: FaWandMagicSparkles },
  { id: 5, label: "Reviewing Quality", icon: TbClockHour12Filled },
  { id: 6, label: "Scoring Results", icon: FaAward },
];

// Model showcase for RadialCarousel
const MODEL_GALLERY = [
  {
    id: "groq",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Groq_logo.svg/1200px-Groq_logo.svg.png",
    title: "Groq LLaMA 3.3 70B",
  },
  {
    id: "hf",
    url: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    title: "HuggingFace GPT-OSS",
  },
  {
    id: "gemini",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/1200px-Google_Gemini_logo.svg.png",
    title: "Google Gemini",
  },
  {
    id: "mongo",
    url: "https://www.svgrepo.com/show/331488/mongodb.svg",
    title: "MongoDB Atlas",
  },
  {
    id: "cloudinary",
    url: "https://res.cloudinary.com/cloudinary/image/upload/c_scale,w_300/v1/logo/for_white_bg/cloudinary_logo_for_white_bg.svg",
    title: "Cloudinary",
  },
  {
    id: "nextjs",
    url: "https://www.svgrepo.com/show/354113/nextjs-icon.svg",
    title: "Next.js 16",
  },
];

// Custom pricing plans for HireLens
const HIRELENS_PLANS = {
  monthly: [
    { id: "free", title: "Free", price: 0, popular: false },
    { id: "pro", title: "Pro", price: 9.99, popular: true },
    { id: "team", title: "Team", price: 29.99, popular: false },
  ],
  yearly: [
    { id: "free", title: "Free", price: 0, popular: false },
    { id: "pro", title: "Pro", price: 7.49, popular: true },
    { id: "team", title: "Team", price: 22.99, popular: false },
  ],
};

// Result tabs
const RESULT_TABS = [
  { id: "analysis", label: "Analysis" },
  { id: "optimized", label: "Optimized" },
  { id: "review", label: "Review Score" },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const resultsRef = useRef<HTMLDivElement>(null);

  // Builder state
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderResult, setBuilderResult] = useState<BuilderResult | null>(null);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const builderResultRef = useRef<HTMLDivElement>(null);

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

      if (!res.ok) {
        throw new Error(data.error ?? "Pipeline failed.");
      }

      setResult(data as PipelineResult);
      setActiveTab("analysis");

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuild(portfolioUrl: string, jobDescription: string, templateId: string) {
    setBuilderError(null);
    setBuilderResult(null);
    setBuilderLoading(true);
    try {
      const res = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioUrl, jobDescription, templateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Build failed.");
      setBuilderResult(data as BuilderResult);
      setTimeout(() => {
        builderResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setBuilderError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBuilderLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)",
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
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in delay-200">
            Our 3-agent pipeline analyzes your resume, rewrites it for ATS & clarity,
            then scores the improvements — all in seconds.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-in delay-300">
            <a
              href="#optimizer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <Sparkles size={15} />
              Optimize My Resume
              <ArrowRight size={14} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:border-indigo-200 hover:text-indigo-600 transition-all"
            >
              How it works
            </a>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 animate-fade-in delay-400">
            {[
              { label: "AI Agents", value: "3×", icon: Brain },
              { label: "Avg. Score Boost", value: "68pts", icon: Star },
              { label: "Models Used", value: "Groq + HF", icon: Wand2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl px-4 py-2.5 border border-slate-200 shadow-sm">
                <Icon size={14} className="text-indigo-500" />
                <span className="font-bold text-slate-900">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Radial Carousel — AI Model Showcase ── */}
        <div className="relative max-w-3xl mx-auto px-4 pb-12">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">
            Powered by · Click to explore
          </p>
          <RadialCarousel
            items={MODEL_GALLERY}
            radius={220}
            thumbnailSize={90}
            centerSize={340}
          />
        </div>
      </section>

      {/* ── Resume Builder ── */}
      <section id="builder" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold mb-4">
            <Zap size={12} />
            1-Click Resume Builder
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Build Your Resume Instantly</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            Paste your portfolio link (GitHub, personal site, LinkedIn) + job description → AI writes a tailored, ATS-optimized resume in seconds.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-indigo-50/30">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-1">AI Resume Builder</p>
            <h3 className="text-xl font-bold text-slate-900">Build from Your Portfolio</h3>
            <p className="text-sm text-slate-500 mt-1">We read your portfolio + the job description to craft a resume that beats ATS filters.</p>
          </div>
          <div className="p-8">
            <ResumeBuilderInput onSubmit={handleBuild} loading={builderLoading} />
          </div>

          {builderLoading && (
            <div className="px-8 pb-8 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Building Your Resume…</p>
              <RunActionButton steps={[
                { id: 1, label: "Reading Portfolio", icon: FaInbox },
                { id: 2, label: "Analyzing Job", icon: FaMagnifyingGlass },
                { id: 3, label: "Matching Keywords", icon: BsFileTextFill },
                { id: 4, label: "Writing Resume", icon: FaWandMagicSparkles },
                { id: 5, label: "Scoring ATS", icon: TbClockHour12Filled },
                { id: 6, label: "Finalizing", icon: FaAward },
              ]} />
            </div>
          )}

          {builderError && (
            <div className="mx-8 mb-8 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              ⚠️ {builderError}
            </div>
          )}
        </div>

        {builderResult && (
          <div ref={builderResultRef} className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 px-2">Your Generated Resume</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <GeneratedResumeCard result={builderResult} />
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">The Process</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">Step {item.step}</p>
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">Plans</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Simple Pricing</h2>
          <p className="text-slate-500 text-sm mt-2">Start free. Upgrade when you need more power.</p>
        </div>
        <div className="flex justify-center">
          <PricingWidget
            initialBilling="monthly"
            initialActivePlanId="pro"
            plansData={HIRELENS_PLANS}
          />
        </div>
      </section>

      {/* ── Optimizer ── */}
      <section id="optimizer" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/30">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">AI Resume Optimizer</p>
            <h2 className="text-xl font-bold text-slate-900">Optimize Your Resume</h2>
            <p className="text-sm text-slate-500 mt-1">Paste your resume text below and our 3-agent AI pipeline will analyze, rewrite, and score it.</p>
          </div>

          <div className="p-8">
            <ResumeInput onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* RunActionButton pipeline progress */}
          {loading && (
            <div className="px-8 pb-8 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Running AI Pipeline</p>
              <RunActionButton steps={PIPELINE_STEPS} />
            </div>
          )}

          {/* API error */}
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
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 px-2">Results</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* ContinuousTabs to switch between result views */}
            <div className="flex justify-center">
              <ContinuousTabs
                tabs={RESULT_TABS}
                defaultActiveId="analysis"
                onChange={(id) => setActiveTab(id)}
              />
            </div>

            {/* Tab content */}
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
              <p className="text-xs text-slate-400 font-mono">Run ID: {result.runId}</p>
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
            <span className="font-medium text-slate-600">HireLens</span> · AI Resume Optimizer
          </div>
          <p>Built by Team Velox · CHARUSAT</p>
          <p>Powered by Groq · HuggingFace · Cloudinary · MongoDB</p>
        </div>
      </footer>
    </div>
  );
}
