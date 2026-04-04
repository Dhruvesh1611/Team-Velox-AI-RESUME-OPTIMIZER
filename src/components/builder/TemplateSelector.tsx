"use client";

import { useState } from "react";
import { RadialCarousel } from "../watermelon-ui/radial-carousel";
import { CheckCircle } from "lucide-react";

export interface ResumeTemplate {
  id: string;
  title: string;
  description: string;
  url: string;
}

// Public serving of images via Next.js — we'll pass base64 or hosted URLs
const TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    title: "Classic Two-Column",
    description: "Like your reference — Skills + Education left, Projects right with dates",
    url: "/templates/classic.png",
  },
  {
    id: "modern",
    title: "Modern Gradient",
    description: "Indigo header, pill skill badges, timeline experience",
    url: "/templates/modern.png",
  },
  {
    id: "tech",
    title: "Tech Focused",
    description: "Dark header, monospace font, GitHub repo style",
    url: "/templates/tech.png",
  },
  {
    id: "minimal",
    title: "Harvard Minimal",
    description: "Ultra clean, serif style, no colors — maximum ATS pass",
    url: "/templates/minimal.png",
  },
  {
    id: "creative",
    title: "Creative Sidebar",
    description: "Purple sidebar with skills, white content area with timeline",
    url: "/templates/creative.png",
  },
  {
    id: "executive",
    title: "Executive Premium",
    description: "Navy header, gold accents, two-column, stats bar",
    url: "/templates/executive.png",
  },
];

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const selected = TEMPLATES.find((t) => t.id === selectedId) ?? TEMPLATES[0];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700 mb-1">Choose Resume Template</p>
        <p className="text-xs text-slate-400">
          Click the ✕ on the main card to browse · Click a thumbnail to select
        </p>
      </div>

      {/* Watermelon RadialCarousel for template selection */}
      <div className="relative">
        <RadialCarousel
          items={TEMPLATES.map((t) => ({ id: t.id, url: t.url, title: t.title }))}
          radius={200}
          thumbnailSize={80}
          centerSize={300}
        />
      </div>

      {/* Manual grid selector for easy clicking */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm ${
              selectedId === t.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-white hover:border-indigo-200"
            }`}
          >
            {selectedId === t.id && (
              <CheckCircle
                size={16}
                className="absolute top-2 right-2 text-indigo-500"
              />
            )}
            <span className="text-xs font-semibold text-slate-800">{t.title}</span>
            <span className="text-[10px] text-slate-500 leading-snug">{t.description}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 mt-2">
        <CheckCircle size={14} className="text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700">
          Selected: <span className="font-semibold">{selected.title}</span> — {selected.description}
        </p>
      </div>
    </div>
  );
}
