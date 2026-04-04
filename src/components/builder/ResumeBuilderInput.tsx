"use client";

import { useState } from "react";
import { Link2, Briefcase, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { SubmitMorphingButton } from "../watermelon-ui/submit-morphing-button";
import TemplateSelector from "./TemplateSelector";

interface ResumeBuilderInputProps {
  onSubmit: (
    portfolioUrl: string,
    jobDescription: string,
    templateId: string,
    githubUrl: string,
    linkedinUrl: string
  ) => void;
  loading: boolean;
}

export default function ResumeBuilderInput({ onSubmit, loading }: ResumeBuilderInputProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [templateId, setTemplateId] = useState("classic");
  const [jobDesc, setJobDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  function isValidUrl(val: string) {
    if (!val.trim()) return true;
    try {
      const u = new URL(val.trim().startsWith("http") ? val.trim() : `https://${val.trim()}`);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function goToStep2() {
    setError(null);
    if (!portfolioUrl.trim() && !githubUrl.trim()) {
      setError("Enter your portfolio URL and/or your GitHub profile URL (at least one).");
      return;
    }
    if (portfolioUrl.trim() && !isValidUrl(portfolioUrl.trim())) {
      setError("Portfolio URL is not valid.");
      return;
    }
    if (githubUrl.trim() && !isValidUrl(githubUrl.trim())) {
      setError("GitHub URL is not valid.");
      return;
    }
    if (linkedinUrl.trim() && !isValidUrl(linkedinUrl.trim())) {
      setError("LinkedIn URL is not valid.");
      return;
    }
    if (
      linkedinUrl.trim() &&
      !/linkedin\.com\/(in|company|pub)\//i.test(
        linkedinUrl.trim().startsWith("http") ? linkedinUrl.trim() : `https://${linkedinUrl.trim()}`
      )
    ) {
      setError("LinkedIn should be a profile URL like https://www.linkedin.com/in/yourname");
      return;
    }
    setStep(2);
  }

  function goToStep3() {
    setStep(3);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (jobDesc.trim().length < 50) {
      setError("Please paste at least 50 characters of the job description.");
      return;
    }
    onSubmit(
      portfolioUrl.trim(),
      jobDesc.trim(),
      templateId,
      githubUrl.trim(),
      linkedinUrl.trim()
    );
  }

  const STEP_LABELS = ["Profiles & links", "Choose Template", "Job Description"];
  const canProceedStep1 = portfolioUrl.trim() || githubUrl.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : isDone
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                <span className="font-bold">{num}.</span>
                <span>{label}</span>
              </div>
              {i < 2 && <ChevronRight size={14} className="text-slate-300 hidden sm:block" />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
            We scrape your <strong>portfolio site</strong> and/or <strong>GitHub</strong> for projects. Your{" "}
            <strong>LinkedIn</strong> link is always placed in the resume contacts. The job description is analyzed:
            <strong> frontend</strong> roles prioritize React/UI projects, <strong> backend</strong> roles prioritize
            APIs and services, <strong> full-stack</strong> keeps a balance.
          </p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Link2 size={14} className="text-indigo-500" />
                Portfolio website <span className="text-slate-400 font-normal">(optional if GitHub is set)</span>
              </span>
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.dev"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <FaGithub size={14} className="text-slate-800" />
                GitHub profile <span className="text-slate-400 font-normal">(optional if portfolio is set)</span>
              </span>
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourusername"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <FaLinkedin size={14} className="text-[#0A66C2]" />
                LinkedIn profile <span className="text-slate-400 font-normal">(recommended)</span>
              </span>
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/yourprofile"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300 disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={goToStep2}
              disabled={!canProceedStep1}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Next: Choose Template <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <TemplateSelector selectedId={templateId} onSelect={setTemplateId} />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 transition-all"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={goToStep3}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
            >
              Next: Job Description <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-indigo-500" />
                Job Description <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={10}
              disabled={loading}
              placeholder={`Paste the full job description here...\n\nExample (frontend):\nWe need a Frontend Engineer strong in React, TypeScript, and Next.js...\n\nExample (backend):\nBackend developer for Node.js microservices, PostgreSQL, Docker...`}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300 disabled:opacity-60"
            />
            <span className="absolute bottom-3 right-4 text-[11px] text-slate-400 font-mono">
              {jobDesc.length} chars
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1.5">
            <p>
              <span className="font-semibold text-slate-600">Portfolio:</span>{" "}
              <span className="font-mono text-slate-700">{portfolioUrl || "—"}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-600">GitHub:</span>{" "}
              <span className="font-mono text-slate-700">{githubUrl || "—"}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-600">LinkedIn:</span>{" "}
              <span className="font-mono text-slate-700">{linkedinUrl || "—"}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-600">Template:</span>{" "}
              <span className="capitalize text-slate-700">{templateId}</span>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 transition-all"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <SubmitMorphingButton loading={loading} disabled={jobDesc.trim().length < 50} />
          </div>
        </form>
      )}
    </div>
  );
}
