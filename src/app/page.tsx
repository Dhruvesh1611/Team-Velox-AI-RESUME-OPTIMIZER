"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/landing/hero";
import ResumeInput from "../components/optimizer/ResumeInput";
import AnalysisCard from "../components/optimizer/AnalysisCard";
import OptimizedResumeCard from "../components/optimizer/OptimizedResumeCard";
import ReviewScoreCard from "../components/optimizer/ReviewScoreCard";
import MockInterviewSection from "../components/optimizer/MockInterviewSection";
import ResultsSummaryBanner from "../components/optimizer/ResultsSummaryBanner";
import HistoryList from "../components/optimizer/HistoryList";
import SiteFooter from "../components/layout/site-footer";
import { RunActionButton } from "../components/watermelon-ui/run-action-button";
import { ContinuousTabs } from "../components/watermelon-ui/continuous-tabs";
import { PricingWidget } from "../components/watermelon-ui/pricing-widget";
import GeneratedResumeCard, { type BuilderResult } from "../components/builder/GeneratedResumeCard";
import {
  Sparkles,
  ArrowRight,
  Sparkle,
  ClipboardMinus,
  Wrench,
  Award,
  Shield,
  CheckCircle,
  Zap,
  Target,
  Mic2,
  BarChart3,
  FileStack,
  ShieldCheck,
  Mic,
  Brain,
} from "lucide-react";
import {
  FaInbox,
  FaMagnifyingGlass,
  FaWandMagicSparkles,
  FaAward,
} from "react-icons/fa6";
import { BsFileTextFill } from "react-icons/bs";
import { TbClockHour12Filled } from "react-icons/tb";
import { color } from "framer-motion";

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
    placement_readiness_score: number;
    placement_summary: string;
    role_strengths: string[];
    role_gaps: string[];
  };
  runId: string | null;
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste or upload",
    desc: "Resume text or PDF/DOCX. We extract clean text server-side (no raw PDF binary in the prompt).",
    icon: <ClipboardMinus />,
  },
  {
    step: "02",
    title: "Add a target job",
    desc: "Optional job description tailors keyword gaps, rewriting, and reviewer feedback to that role.",
    icon: <Target />,
  },
  {
    step: "03",
    title: "Analyzer agent",
    desc: "Groq LLaMA 3.3 extracts skills, weak phrasing, missing metrics, and structure issues.",
    icon: <Wrench />,
  },
  {
    step: "04",
    title: "Optimizer agent",
    desc: "Rewrites for clarity and ATS-friendly structure without inventing employers or fake metrics.",
    icon: <Sparkle />,
  },
  {
    step: "05",
    title: "Reviewer + readiness",
    desc: "Hugging Face model scores the lift and estimates interview readiness with strengths and gaps.",
    icon: <Award />,
  },
  {
    step: "06",
    title: "Interview prep",
    desc: "Generate role-aware mock questions and answer frameworks from your optimized resume.",
    icon: <Mic />,
  },
];

const WHY_HIRELENS = [
  {
    icon: Target,
    title: "ATS-Optimized Output",
    desc: "Every resume is tailored to pass Applicant Tracking Systems. We match keywords, format structure, and optimize readability for automated scanners.",
  },
  {
    icon: Shield,
    title: "Accurate & Real Data",
    desc: "We don't fabricate content. Our AI extracts real projects, skills, and achievements from your portfolio and enhances them — nothing made up.",
  },
  {
    icon: BarChart3,
    title: "High ATS Score Guaranteed",
    desc: "Our multi-agent pipeline ensures your resume scores 85+ on ATS checkers. We optimize for keyword density, formatting, and professional impact.",
  },
  {
    icon: Award,
    title: "AI-Reviewed Quality",
    desc: "Every generated resume is reviewed by a second AI agent that checks for clarity, impact, and completeness — like having a peer review built in.",
  },
];

const PLATFORM_FEATURES = [
  {
    title: "Job-specific optimization",
    desc: "Paste a JD to align keyword gaps, rewrites, and reviewer commentary with the role you want.",
    icon: Target,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    title: "Readiness estimate",
    desc: "See optimization score plus a separate readiness signal, with strengths and gaps called out clearly.",
    icon: ShieldCheck,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    title: "Mock interview prep",
    desc: "Six tailored questions with bullet answer frameworks grounded in your resume (no scripts).",
    icon: Mic2,
    color: "text-rose-600 bg-rose-50 border-rose-100",
  },
  {
    title: "Resume from portfolio",
    desc: "Builder takes portfolio + GitHub + LinkedIn URLs, infers frontend/backend from the JD, and prioritizes matching repos.",
    icon: FileStack,
    color: "text-amber-600 bg-amber-50 border-amber-100",
  }
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
  { id: "review", label: "Review" },
  { id: "interview", label: "Interview prep" },
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

  const [lastResumeText, setLastResumeText] = useState("");
  const [lastJobDescription, setLastJobDescription] = useState("");

  async function handleSubmit(
    resumeText: string,
    file?: string,
    fileName?: string,
    jobDescription?: string
  ) {
    setApiError(null);
    setResult(null);
    setLoading(true);

    try {
      const body: {
        resumeText: string;
        file?: string;
        fileName?: string;
        jobDescription?: string;
      } = { resumeText };
      if (file) body.file = file;
      if (fileName) body.fileName = fileName;
      if (jobDescription) body.jobDescription = jobDescription;

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
      setLastResumeText(resumeText);
      setLastJobDescription(jobDescription ?? "");
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

  async function handleBuild(
    portfolioUrl: string,
    jobDescription: string,
    templateId: string,
    githubUrl: string,
    linkedinUrl: string
  ) {
    setBuilderError(null);
    setBuilderResult(null);
    setBuilderLoading(true);
    try {
      const res = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioUrl,
          githubUrl,
          linkedinUrl,
          jobDescription,
          templateId,
        }),
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
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-6 leading-relaxed animate-fade-in delay-200">
            Three agents analyze, rewrite, and review your resume. Add a job description for tailored keywords,
            a readiness estimate, and mock interview prep — all in one flow.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl mx-auto animate-fade-in delay-300">
            {[
              { label: "Job targeting", Icon: Target },
              { label: "Readiness score", Icon: ShieldCheck },
              { label: "Mock interview", Icon: Mic2 },
              { label: "3× AI Agents", Icon: Brain },
            ].map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100"
              >
                <Icon size={13} className="text-indigo-600" />
                {label}
              </span>
            ))}
          </div>

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
                className={`rounded-2xl border bg-violet-50 border-violet-100 p-6 hover:shadow-md transition-all animate-slide-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-indigo-100 flex-shrink-0`}>
                    <Icon size={18} className="text-violet-500" />
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
              <Icon size={15} className="text-violet-500" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2 mt-4">The Process</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-3xl mb-3 text-grey-200 w-10 h-10 rounded-xl border flex items-center justify-center mb-3 text-violet-500">{item.icon}</div>
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">Step {item.step}</p>
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 mt-4">
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
      <section id="optimizer" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/30">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">AI Resume Optimizer</p>
            <h2 className="text-xl font-bold text-slate-900">Optimize Your Resume</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Run the full pipeline: analysis → optimized draft → review with readiness + strengths/gaps →{" "}
              <span className="text-slate-700 font-medium">Interview prep</span> tab for mock questions.
              Use <span className="text-indigo-700 font-medium">Job-specific mode</span> when you have a posting.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
              <li className="px-2 py-1 rounded-md bg-white/80 border border-slate-200">Analyzer</li>
              <li className="px-2 py-1 rounded-md bg-white/80 border border-slate-200">Optimizer</li>
              <li className="px-2 py-1 rounded-md bg-white/80 border border-slate-200">Reviewer</li>
              <li className="px-2 py-1 rounded-md bg-indigo-100/80 border border-indigo-200 text-indigo-800">
                 Interview 
              </li>
            </ul>
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

            <ResultsSummaryBanner
              improvementScore={result.review.improvement_score}
              placementReadiness={result.review.placement_readiness_score}
              jobTargeted={lastJobDescription.trim().length > 0}
              onGoInterview={() => {
                setActiveTab("interview");
                setTimeout(() => {
                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 80);
              }}
            />

            <p className="text-center text-xs text-slate-400 px-2">
              Use the tabs to switch views. Interview prep generates questions on demand (separate API call).
            </p>

            {/* ContinuousTabs — controlled so &quot;Try Now&quot; / new runs reset correctly */}
            <div className="flex justify-center overflow-x-auto pb-1">
              <ContinuousTabs
                tabs={RESULT_TABS}
                defaultActiveId="analysis"
                activeId={activeTab}
                onChange={(id) => setActiveTab(id)}
              />
            </div>

            <div className="mt-6" id="results-tabs">
              {activeTab === "analysis" && (
                <AnalysisCard analysis={result.analysis} />
              )}
              {activeTab === "optimized" && (
                <OptimizedResumeCard optimizedResume={result.optimizedResume} />
              )}
              {activeTab === "review" && (
                <ReviewScoreCard review={result.review} />
              )}
              {activeTab === "interview" && (
                <MockInterviewSection
                  resumeText={lastResumeText.trim() || result.optimizedResume}
                  optimizedResume={result.optimizedResume}
                  jobDescription={lastJobDescription}
                />
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


      {/* ── Platform features (UI map of product) ── */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 mt-4">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-2">Product</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What HireLens Offers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {PLATFORM_FEATURES.map(({ title, desc, icon: Icon, color }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-violet-200 hover:shadow-md transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${color}`}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
