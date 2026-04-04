"use client";

import { Sparkles } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-2 text-sm text-slate-400 text-center">
        <div className="flex items-center gap-2 justify-center">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
            <Sparkles size={10} className="text-white" />
          </div>
          <span className="font-medium text-slate-600">HireLens</span> · AI Resume Suite
        </div>
        <p className="text-slate-400">Copyright © 2026 by Velox</p>
      </div>
    </footer>
  );
}
