"use client";

import { useState } from "react";
import { FileText, GitBranch, Sparkles, Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <FileText size={16} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-lg tracking-tight">
            Hire<span className="text-indigo-600">Lens</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wide border border-indigo-100">
            AI Powered
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#optimizer"
            className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium"
          >
            Optimizer
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium"
          >
            How it works
          </a>
          <a
            href="#history"
            className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium"
          >
            History
          </a>
          <a
            href="https://github.com/Dhruvesh1611/Team-Velox-AI-RESUME-OPTIMIZER"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 rounded-lg px-3 py-1.5 hover:border-slate-300 hover:shadow-sm"
          >
            <GitBranch size={14} />
            GitHub
          </a>
          <a
            href="#optimizer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg px-4 py-1.5 shadow-sm"
          >
            <Sparkles size={14} />
            Try Now
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-3 animate-fade-in">
          <a href="#optimizer" className="text-sm text-slate-700 font-medium py-1" onClick={() => setMobileOpen(false)}>Optimizer</a>
          <a href="#how-it-works" className="text-sm text-slate-700 font-medium py-1" onClick={() => setMobileOpen(false)}>How it works</a>
          <a href="#history" className="text-sm text-slate-700 font-medium py-1" onClick={() => setMobileOpen(false)}>History</a>
          <a href="#optimizer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg px-4 py-2 w-fit" onClick={() => setMobileOpen(false)}>
            <Sparkles size={14} /> Try Now
          </a>
        </div>
      )}
    </header>
  );
}
