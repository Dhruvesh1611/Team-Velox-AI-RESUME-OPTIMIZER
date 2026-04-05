"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, Lightbulb, TrendingUp, TrendingDown, Eye, Download, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ResumeData {
  name: string;
  title: string;
  contacts: { email?: string; phone?: string; github?: string; linkedin?: string; portfolio?: string };
  skills: { frontend?: string; backend?: string; database?: string; tools?: string; languages?: string; uiux?: string; cloud?: string };
  achievements: Array<{ title: string; award?: string; link?: string }>;
  certificates: Array<{ name: string; link?: string }>;
  projects: Array<{
    name: string;
    type: string;
    category?: string;
    dateRange?: string;
    description?: string;
    bullets: string[];
    technologies?: string;
    links?: { github?: string; live?: string; demo?: string };
  }>;
  education: Array<{ degree: string; institution: string; gpa?: string; year?: string; percentage?: string }>;
}

export interface BuilderResult {
  resumeData: ResumeData | null;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tip: string;
  templateId?: string;
}

type NormalizedProject = ResumeData["projects"][number];

type DensityMode = "compact" | "standard" | "expanded";

function estimateContentSignals(data: ResumeData): { projectCount: number; bulletCount: number; certCount: number } {
  const projectCount = data.projects.length;
  const bulletCount = data.projects.reduce((acc, p) => acc + (p.bullets?.filter(Boolean).length ?? 0), 0);
  const certCount = data.certificates.length;
  return { projectCount, bulletCount, certCount };
}

function pickDensityMode(data: ResumeData, compact: boolean): DensityMode {
  if (compact) return "compact";
  const { projectCount, bulletCount, certCount } = estimateContentSignals(data);
  if (projectCount >= 8 || bulletCount >= 20 || certCount >= 6) return "expanded";
  return "standard";
}

function normalizeProjectType(p: NormalizedProject): NormalizedProject["type"] {
  const text = `${p.type} ${p.category ?? ""} ${p.name}`.toLowerCase();
  if (text.includes("intern") || text.includes("company") || text.includes("trainee")) return "internship";
  if (text.includes("freelance") || text.includes("client") || text.includes("paid")) return "freelancing";
  if (text.includes("open source") || text.includes("opensource") || text.includes("contribution")) return "opensource";
  if (text.includes("fullstack") || text.includes("full stack") || text.includes("mern")) return "fullstack";
  if (text.includes("clone") || text.includes("practice") || text.includes("tutorial")) return "other";
  return p.type || "other";
}

function prepareProjects(projects: ResumeData["projects"]): {
  featured: NormalizedProject[];
  secondary: NormalizedProject[];
  allSorted: NormalizedProject[];
} {
  const priorityOrder: Record<string, number> = {
    internship: 0,
    freelancing: 1,
    opensource: 2,
    fullstack: 3,
    other: 4,
  };

  const normalized = projects.map((p) => {
    const normalizedType = normalizeProjectType(p);
    const bulletCap = 5;
    return {
      ...p,
      type: normalizedType,
      bullets: (p.bullets || []).filter(Boolean).slice(0, bulletCap),
    };
  });

  const allSorted = [...normalized].sort(
    (a, b) => (priorityOrder[a.type] ?? 9) - (priorityOrder[b.type] ?? 9)
  );

  const featured = allSorted.filter((p) => ["internship", "freelancing", "opensource", "fullstack"].includes(p.type));
  const secondary = allSorted.filter((p) => p.type === "other");

  return { featured, secondary, allSorted };
}

function buildProfileSnapshot(data: ResumeData): string {
  const topSkills = [
    data.skills.frontend,
    data.skills.backend,
    data.skills.database,
    data.skills.tools,
  ]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const priorityOrder: Record<string, number> = {
    internship: 0,
    freelancing: 1,
    opensource: 2,
    fullstack: 3,
    other: 4,
  };

  const topProjects = [...data.projects]
    .sort((a, b) => {
      const ta = normalizeProjectType(a);
      const tb = normalizeProjectType(b);
      return (priorityOrder[ta] ?? 9) - (priorityOrder[tb] ?? 9);
    })
    .map((p) => p.name)
    .filter(Boolean)
    .slice(0, 3);

  const roleLine = `${data.title || "Software Developer"} focused on building production-ready web applications across modern web ecosystems.`;
  const stackLine = topSkills.length > 0
    ? `Core stack includes ${topSkills.join(", ")}, with practical specialization in end-to-end feature delivery.`
    : "Experienced in frontend, backend, and integration-focused development for scalable web products.";
  const deliveryLine = topProjects.length > 0
    ? `Delivered portfolio-backed solutions through projects such as ${topProjects.join(", ")}, emphasizing clean architecture and maintainable design.`
    : "Delivered portfolio-backed solutions with emphasis on maintainable architecture and reliable implementation practices.";
  const impactLine = "Work prioritizes performance improvements, scalable system behavior, and optimized user experience outcomes.";

  return [roleLine, stackLine, deliveryLine, impactLine].join(" ");
}

function buildProfileLines(data: ResumeData): string[] {
  const topTools = [data.skills.tools, data.skills.cloud]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const specialization = data.skills.frontend
    ? "specializing in frontend-to-backend product workflows"
    : "specializing in end-to-end web solution delivery";

  return [
    `${data.title || "Software Developer"} focused on building production-ready applications with practical engineering depth.`,
    `Core expertise includes modern web architecture, API-driven integrations, and maintainable system design, ${specialization}.`,
    topTools.length > 0
      ? `Preferred tools and platforms include ${topTools.join(", ")}, enabling reliable and scalable implementation patterns.`
      : "Preferred tooling emphasizes reliability, maintainability, and scalable implementation practices.",
    "Execution focus remains on performance optimization, better user experience, and sustainable scalability outcomes.",
  ];
}

function expandCredentialLabel(item: string): string {
  const text = item.trim();
  if (!text) return text;
  if (/cert|certificate|aws|google|azure|meta|coursera|udemy|nptel|hackathon|winner|award/i.test(text)) {
    return text;
  }
  if (text.length <= 28) {
    return `${text} (Professional Recognition)`;
  }
  return text;
}

function normalizeDescriptionLines(text: string, lineTarget: number): string {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= lineTarget) return text;
  return parts.slice(0, lineTarget).join(" ");
}

function buildEducationNotes(item: ResumeData["education"][number], data: ResumeData): string[] {
  const topAreas = [data.skills.frontend, data.skills.backend, data.skills.database]
    .filter(Boolean)
    .join(", ")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const notes: string[] = [];
  notes.push(`Specialization: ${item.degree?.toLowerCase().includes("computer") ? "Software and web systems" : "Application development and software engineering"}`);
  if (topAreas.length > 0) {
    notes.push(`Relevant coursework: ${topAreas.join(", ")}`);
  }
  if (data.projects.length > 0) {
    notes.push(`Academic achievement: Applied learning through ${data.projects.length}+ portfolio-backed projects.`);
  }

  return notes.slice(0, 3);
}

function normalizeCredentialKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildUnifiedCredentialItems(data: ResumeData): string[] {
  const merged = new Map<string, string>();

  const put = (text: string) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return;

    const key = normalizeCredentialKey(cleaned);
    if (!key) return;

    const existing = merged.get(key);
    // Prefer richer variant when duplicate entries are found.
    if (!existing || cleaned.length > existing.length) {
      merged.set(key, cleaned);
    }
  };

  for (const cert of data.certificates) {
    if (cert?.name) put(cert.name);
  }

  for (const achievement of data.achievements) {
    const text = [achievement?.title, achievement?.award].filter(Boolean).join(" - ");
    if (text) put(text);
  }

  return Array.from(merged.values());
}

// ── Resume renderer component ─────────────────────────────────────────────

function ResumeRenderer({ data, compact = false }: { data: ResumeData; compact?: boolean }) {
  const densityMode = pickDensityMode(data, compact);
  const fs = compact ? "text-[9px]" : "text-[10px]";
  const headingBorder = "border-b-2 border-gray-800 pb-0.5 mb-1.5 font-bold uppercase tracking-wider";
  const profileSnapshot = buildProfileSnapshot(data);
  const profileLines = buildProfileLines(data);

  const skillRows = [
    data.skills.frontend && { label: "Frontend", value: data.skills.frontend },
    data.skills.backend && { label: "Backend", value: data.skills.backend },
    data.skills.database && { label: "Database", value: data.skills.database },
    data.skills.tools && { label: "Tools", value: data.skills.tools },
    data.skills.cloud && { label: "Cloud", value: data.skills.cloud },
    data.skills.uiux && { label: "UI/UX Design", value: data.skills.uiux },
    data.skills.languages && { label: "Languages", value: data.skills.languages },
  ].filter(Boolean) as { label: string; value: string }[];

  const { featured, secondary } = prepareProjects(data.projects);
  const credentialItems = buildUnifiedCredentialItems(data).map(expandCredentialLabel);
  const groupedPrimary: Record<string, typeof featured> = {};
  const groupedSecondary: Record<string, typeof secondary> = {};

  const featuredLimit = densityMode === "expanded" ? 8 : compact ? 5 : 6;
  const secondaryLimit = densityMode === "expanded" ? 10 : compact ? 3 : 6;
  const secondaryBulletLimit = densityMode === "expanded" ? 3 : 2;
  const isUnderfilled = (featured.length + secondary.length) <= 4;
  const descLineTarget = isUnderfilled ? 3 : 2;

  for (const p of featured.slice(0, featuredLimit)) {
    const cat = p.category || p.type.toUpperCase();
    if (!groupedPrimary[cat]) groupedPrimary[cat] = [];
    groupedPrimary[cat].push(p);
  }

  for (const p of secondary.slice(0, secondaryLimit)) {
    const cat = p.category || "OTHER PROJECTS";
    if (!groupedSecondary[cat]) groupedSecondary[cat] = [];
    groupedSecondary[cat].push(p);
  }

  return (
    <div
      className={`bg-white text-gray-900 ${fs}`}
      style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: 1.45 }}
    >
      {/* ── Name + Title ── */}
      <div className="mb-2 pb-1.5 border-b border-gray-400">
        <h1 className={`font-extrabold uppercase tracking-wide ${compact ? "text-lg" : "text-xl"}`}>
          {data.name}
        </h1>
        <p className={`text-gray-600 uppercase tracking-wider font-medium ${compact ? "text-[8px]" : "text-[9px]"}`}>
          {data.title}
        </p>
        {/* Contact bar */}
        <div className={`flex flex-wrap gap-x-3 gap-y-0.5 mt-1 ${compact ? "text-[7.5px]" : "text-[8.5px]"} text-gray-600`}>
          {data.contacts.email && <span>✉ {data.contacts.email}</span>}
          {data.contacts.phone && <span>☏ {data.contacts.phone}</span>}
          {data.contacts.github && <span>⌥ {data.contacts.github.replace("https://", "")}</span>}
          {data.contacts.linkedin && <span>in {data.contacts.linkedin.replace("https://linkedin.com/in/", "linkedin.com/in/")}</span>}
          {data.contacts.portfolio && <span>⊕ {data.contacts.portfolio.replace("https://", "")}</span>}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="flex gap-4">
        {/* LEFT column */}
        <div className="w-[38%] flex-shrink-0 space-y-2.5">
          {/* Profile Snapshot */}
          {profileSnapshot && densityMode !== "compact" && (
            <div>
              <div className={headingBorder}>Profile</div>
              <div className="space-y-1">
                {profileLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Technical Skills */}
          {skillRows.length > 0 && (
            <div>
              <div className={headingBorder}>Technical Skills</div>
              <div className="space-y-0.5">
                {skillRows.map(({ label, value }) => (
                  <p key={label}><span className="font-bold">{label}:</span> {value}</p>
                ))}
              </div>
            </div>
          )}

          {/* Unified credentials */}
          {credentialItems.length > 0 && (
            <div>
              <div className={headingBorder}>Certifications &amp; Achievements</div>
              <ul className="space-y-0.5">
                {credentialItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <div>
              <div className={headingBorder}>Education</div>
              {data.education.map((e, i) => (
                <div key={i} className="mb-1.5">
                  <p className="font-bold">{e.degree}</p>
                  <p>{e.institution}</p>
                  {e.gpa && <p>CGPA: <span className="font-semibold">{e.gpa}</span></p>}
                  {e.year && <p className="text-gray-500">{e.year}</p>}
                  {e.percentage && <p>Percentage: {e.percentage}</p>}
                  {buildEducationNotes(e, data).map((note, nIdx) => (
                    <p key={nIdx}>{note}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* RIGHT column — Projects */}
        <div className="flex-1 space-y-2">
          {featured.length > 0 && <div className={headingBorder}>Experience & Projects</div>}
          {Object.entries(groupedPrimary).map(([cat, projs]) => (
            <div key={cat} className="mb-2">
              {/* Category heading */}
              <p className={`font-extrabold uppercase text-center mb-1 ${compact ? "text-[8px]" : "text-[9px]"}`}>
                {cat}
              </p>
              {projs.map((p, i) => (
                <div key={i} className="mb-2">
                  {/* Project name + date */}
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="font-bold uppercase">{p.name}</p>
                    {p.dateRange && <p className="text-gray-500 text-[8px] flex-shrink-0">[{p.dateRange}]</p>}
                  </div>
                  {/* Links row */}
                  {p.links && (p.links.github || p.links.live || p.links.demo) && (
                    <div className={`flex gap-2 mb-0.5 ${compact ? "text-[7px]" : "text-[8px]"} text-indigo-600`}>
                      {p.links.github && <span>⌥ Github-link</span>}
                      {p.links.live && <span>⊕ link</span>}
                      {p.links.demo && <span>▷ Demo video</span>}
                    </div>
                  )}
                  {/* Description */}
                  {p.description && <p className="italic text-gray-600 mb-0.5">{normalizeDescriptionLines(p.description, descLineTarget)}</p>}
                  {/* Bullets */}
                  <ul className="space-y-0.5">
                    {p.bullets.map((b, j) => (
                      <li key={j} className="flex gap-1">
                        <span className="flex-shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Technologies */}
                  {p.technologies && (
                    <p className="mt-0.5"><span className="font-semibold">Technologies:</span> {p.technologies}</p>
                  )}
                </div>
              ))}
            </div>
          ))}

          {secondary.length > 0 && (
            <>
              <div className={headingBorder}>Additional Projects</div>
              {Object.entries(groupedSecondary).map(([cat, projs]) => (
                <div key={cat} className="mb-2">
                  <p className={`font-extrabold uppercase text-center mb-1 ${compact ? "text-[8px]" : "text-[9px]"}`}>
                    {cat}
                  </p>
                  {projs.map((p, i) => (
                    <div key={i} className="mb-1.5">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <p className="font-bold uppercase">{p.name}</p>
                        {p.dateRange && <p className="text-gray-500 text-[8px] flex-shrink-0">[{p.dateRange}]</p>}
                      </div>
                      <ul className="space-y-0.5">
                        {p.bullets.slice(0, secondaryBulletLimit).map((b, j) => (
                          <li key={j} className="flex gap-1">
                            <span className="flex-shrink-0">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Print HTML generator ──────────────────────────────────────────────────

function buildPrintHTML(data: ResumeData, atsScore: number): string {
  const densityMode = pickDensityMode(data, false);
  const profileSnapshot = buildProfileSnapshot(data);
  const profileLines = buildProfileLines(data);
  const credentialItems = buildUnifiedCredentialItems(data).map(expandCredentialLabel);
  const { featured, secondary } = prepareProjects(data.projects);

  const groupedPrimary: Record<string, typeof featured> = {};
  const groupedSecondary: Record<string, typeof secondary> = {};

  const featuredLimit = densityMode === "expanded" ? 8 : 6;
  const secondaryLimit = densityMode === "expanded" ? 10 : 6;
  const secondaryBulletLimit = densityMode === "expanded" ? 3 : 2;
  const isUnderfilled = (featured.length + secondary.length) <= 4;
  const descLineTarget = isUnderfilled ? 3 : 2;

  for (const p of featured.slice(0, featuredLimit)) {
    const cat = p.category || p.type.toUpperCase();
    if (!groupedPrimary[cat]) groupedPrimary[cat] = [];
    groupedPrimary[cat].push(p);
  }

  for (const p of secondary.slice(0, secondaryLimit)) {
    const cat = p.category || "OTHER PROJECTS";
    if (!groupedSecondary[cat]) groupedSecondary[cat] = [];
    groupedSecondary[cat].push(p);
  }

  const esc = (s?: string) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const skillRows = [
    data.skills.frontend && `<p><strong>Frontend:</strong> ${esc(data.skills.frontend)}</p>`,
    data.skills.backend && `<p><strong>Backend:</strong> ${esc(data.skills.backend)}</p>`,
    data.skills.database && `<p><strong>Database:</strong> ${esc(data.skills.database)}</p>`,
    data.skills.tools && `<p><strong>Tools:</strong> ${esc(data.skills.tools)}</p>`,
    data.skills.cloud && `<p><strong>Cloud:</strong> ${esc(data.skills.cloud)}</p>`,
    data.skills.uiux && `<p><strong>UI/UX Design:</strong> ${esc(data.skills.uiux)}</p>`,
    data.skills.languages && `<p><strong>Languages:</strong> ${esc(data.skills.languages)}</p>`,
  ].filter(Boolean).join("");

  const primaryHTML = Object.entries(groupedPrimary).map(([cat, projs]) => `
    <div class="proj-cat">
      <p class="proj-cat-title">${esc(cat)}</p>
      ${projs.map(p => `
        <div class="proj-item">
          <div class="proj-header">
            <span class="proj-name">${esc(p.name)}</span>
            ${p.dateRange ? `<span class="proj-date">[${esc(p.dateRange)}]</span>` : ""}
          </div>
          ${p.links && (p.links.github || p.links.live || p.links.demo) ? `
            <div class="proj-links">
              ${p.links.github ? `<span>⌥ Github-link</span>` : ""}
              ${p.links.live ? `<span>⊕ link</span>` : ""}
              ${p.links.demo ? `<span>▷ Demo video</span>` : ""}
            </div>` : ""}
          ${p.description ? `<p class="proj-desc">${esc(normalizeDescriptionLines(p.description, descLineTarget))}</p>` : ""}
          <ul>${p.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
          ${p.technologies ? `<p><strong>Technologies:</strong> ${esc(p.technologies)}</p>` : ""}
        </div>
      `).join("")}
    </div>
  `).join("");

  const secondaryHTML = Object.entries(groupedSecondary).map(([cat, projs]) => `
    <div class="proj-cat">
      <p class="proj-cat-title">${esc(cat)}</p>
      ${projs.map(p => `
        <div class="proj-item">
          <div class="proj-header">
            <span class="proj-name">${esc(p.name)}</span>
            ${p.dateRange ? `<span class="proj-date">[${esc(p.dateRange)}]</span>` : ""}
          </div>
          <ul>${p.bullets.slice(0, secondaryBulletLimit).map(b => `<li>${esc(b)}</li>`).join("")}</ul>
        </div>
      `).join("")}
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(data.name)} - Resume</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Times New Roman',serif; font-size:10pt; color:#111; background:#fff; padding:0.5in 0.6in; }
    h1 { font-size:18pt; font-weight:900; text-transform:uppercase; letter-spacing:0.03em; }
    .subtitle { font-size:8pt; text-transform:uppercase; letter-spacing:0.08em; color:#555; margin:1pt 0; }
    .contact-bar { font-size:7.5pt; color:#444; display:flex; flex-wrap:wrap; gap:6pt; margin-top:3pt; }
    hr { border:none; border-top:1px solid #999; margin:4pt 0; }
    .body { display:flex; gap:14pt; margin-top:4pt; }
    .left { width:38%; flex-shrink:0; }
    .right { flex:1; }
    .section-title { font-size:9pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.04em; border-bottom:2px solid #111; padding-bottom:1pt; margin-bottom:3pt; margin-top:8pt; }
    .section-title:first-child { margin-top:0; }
    .ach-title { font-weight:600; }
    .ach-award { font-weight:bold; color:#3730a3; }
    .skill-row { margin-bottom:1pt; font-size:9.5pt; }
    .cert-item { margin-bottom:1pt; }
    .edu-deg { font-weight:bold; }
    .edu-gpa { font-weight:600; }
    .proj-cat-title { font-weight:900; text-transform:uppercase; text-align:center; font-size:9pt; margin-bottom:2pt; }
    .proj-item { margin-bottom:6pt; }
    .proj-header { display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; }
    .proj-name { font-weight:bold; text-transform:uppercase; font-size:9.5pt; }
    .proj-date { font-size:7.5pt; color:#555; }
    .proj-links { font-size:7.5pt; color:#3730a3; display:flex; gap:8pt; margin:1pt 0; }
    .proj-desc { font-style:italic; color:#555; font-size:8.5pt; margin:1pt 0; }
    ul { padding-left:10pt; margin:1pt 0; }
    li { margin-bottom:1pt; font-size:9pt; }
    .ats-badge { position:fixed; top:10px; right:14px; background:#3730a3; color:#fff; padding:3px 10px; border-radius:16px; font-size:8pt; font-family:sans-serif; }
    @media print { .ats-badge { display:none; } body { padding:0.45in 0.55in; } }
  </style>
</head>
<body>
  <div class="ats-badge">ATS: ${atsScore}/100</div>
  <h1>${esc(data.name)}</h1>
  <p class="subtitle">${esc(data.title)}</p>
  <div class="contact-bar">
    ${data.contacts.email ? `<span>✉ ${esc(data.contacts.email)}</span>` : ""}
    ${data.contacts.phone ? `<span>☏ ${esc(data.contacts.phone)}</span>` : ""}
    ${data.contacts.github ? `<span>⌥ ${esc(data.contacts.github)}</span>` : ""}
    ${data.contacts.linkedin ? `<span>in ${esc(data.contacts.linkedin)}</span>` : ""}
    ${data.contacts.portfolio ? `<span>⊕ ${esc(data.contacts.portfolio)}</span>` : ""}
  </div>
  <hr>
  <div class="body">
    <div class="left">
      ${profileSnapshot ? `
        <div class="section-title">Profile</div>
        ${profileLines.map(line => `<p>${esc(line)}</p>`).join("")}` : ""}
      <div class="section-title">Technical Skills</div>
      ${skillRows}
      ${credentialItems.length > 0 ? `
        <div class="section-title">Certifications & Achievements</div>
        ${credentialItems.map(item => `<p class="cert-item">• ${esc(item)}</p>`).join("")}` : ""}
      ${data.education.length > 0 ? `
        <div class="section-title">Education</div>
        ${data.education.map(e => `
          <div style="margin-bottom:4pt">
            <p class="edu-deg">${esc(e.degree)}</p>
            <p>${esc(e.institution)}</p>
            ${e.gpa ? `<p class="edu-gpa">CGPA: ${esc(e.gpa)}</p>` : ""}
            ${e.year ? `<p style="color:#555">${esc(e.year)}</p>` : ""}
            ${e.percentage ? `<p>Percentage: ${esc(e.percentage)}</p>` : ""}
            ${buildEducationNotes(e, data).map(note => `<p>${esc(note)}</p>`).join("")}
          </div>`).join("")}` : ""}
    </div>
    <div class="right">
      ${featured.length > 0 ? `<div class="section-title">Experience & Projects</div>` : ""}
      ${primaryHTML}
      ${secondary.length > 0 ? `<div class="section-title">Additional Projects</div>` : ""}
      ${secondaryHTML}
    </div>
  </div>
</body>
</html>`;
}

// ── Main component ────────────────────────────────────────────────────────

export default function GeneratedResumeCard({ result }: { result: BuilderResult }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [inlineScale, setInlineScale] = useState(1);
  const [previewScale, setPreviewScale] = useState(1);
  const inlineViewportRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const data = result.resumeData;
  const printHtml = useMemo(() => {
    if (!data) return "";
    return buildPrintHTML(data, result.atsScore);
  }, [data, result.atsScore]);

  useEffect(() => {
    const el = inlineViewportRef.current;
    if (!el) return;

    const SAFE_PAD_X = 32;
    const SAFE_PAD_Y = 32;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.min(
        (rect.width - SAFE_PAD_X) / A4_WIDTH,
        (rect.height - SAFE_PAD_Y) / A4_HEIGHT,
        1
      );
      setInlineScale((prev) => (Math.abs(prev - next) > 0.01 ? next : prev));
    };

    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);
    const id = window.requestAnimationFrame(updateScale);

    return () => {
      ro.disconnect();
      window.cancelAnimationFrame(id);
    };
  }, [A4_WIDTH]);

  useEffect(() => {
    if (!showPreview) return;
    const el = previewViewportRef.current;
    if (!el) return;

    const SAFE_PAD_X = 32;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.min((rect.width - SAFE_PAD_X) / A4_WIDTH, 1);
      setPreviewScale((prev) => (Math.abs(prev - next) > 0.01 ? next : prev));
    };

    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);
    const id = window.requestAnimationFrame(updateScale);

    return () => {
      ro.disconnect();
      window.cancelAnimationFrame(id);
    };
  }, [A4_WIDTH, showPreview]);

  function copyResume() {
    if (!data) return;
    const text = [
      data.name, data.title, "",
      Object.entries(data.contacts).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(" | "), "",
      "TECHNICAL SKILLS", ...Object.entries(data.skills).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`), "",
      "CERTIFICATES", ...data.certificates.map(c => `• ${c.name}`), "",
      "PROJECTS", ...data.projects.flatMap(p => [p.name, ...p.bullets.map(b=>`• ${b}`)]), "",
      "EDUCATION", ...data.education.map(e => `${e.degree} — ${e.institution}${e.gpa ? ` | CGPA: ${e.gpa}` : ""}`)
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPDF() {
    if (!printHtml) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(printHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  }

  // ATS score ring
  const score = Math.min(100, Math.max(0, result.atsScore));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 85 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";

  if (!data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
        Could not parse the resume data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ATS Score + Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ATS Score</p>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle cx="60" cy="60" r={radius} fill="none" stroke={scoreColor} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            <text x="60" y="64" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1e293b">{score}</text>
            <text x="60" y="80" textAnchor="middle" fontSize="9" fill="#94a3b8">out of 100</text>
          </svg>
          <p className="text-sm font-semibold" style={{ color: scoreColor }}>
            {score >= 85 ? "Excellent Match" : score >= 70 ? "Good Match" : "Needs Work"}
          </p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          {result.matchedKeywords.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">
                <TrendingUp size={12} /> Matched ({result.matchedKeywords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {result.matchedKeywords.map(kw => (
                  <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {result.missingKeywords.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">
                <TrendingDown size={12} /> Consider Adding ({result.missingKeywords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map(kw => (
                  <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {result.tip && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <Lightbulb size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-700 leading-relaxed">{result.tip}</p>
            </div>
          )}
        </div>
      </div>

      {/* Resume Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-0.5">Generated Resume</p>
            <p className="text-sm text-slate-500">{data.name} · {data.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-all">
              <Eye size={13} /> View Preview
            </button>
            <button onClick={downloadPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm">
              <Download size={13} /> Download PDF
            </button>
            <button onClick={copyResume}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
              {copied ? <><Check size={13} className="text-emerald-500" />Copied!</> : <><Copy size={13} />Copy</>}
            </button>
          </div>
        </div>

        {/* Inline A4 preview */}
        <div
          ref={inlineViewportRef}
          className="h-[80vh] overflow-hidden bg-slate-200/70 p-4 sm:p-6 flex justify-center items-center"
        >
          <div
            className="relative my-2"
            style={{
              width: `${A4_WIDTH * inlineScale}px`,
              height: `${A4_HEIGHT * inlineScale}px`,
            }}
          >
            <div
              className="bg-white border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
              style={{
                width: `${A4_WIDTH}px`,
                height: `${A4_HEIGHT}px`,
                transform: `scale(${inlineScale})`,
                transformOrigin: "top left",
              }}
            >
              <iframe
                title="A4 Resume Preview Inline"
                srcDoc={printHtml}
                className="w-full h-full border-0"
                scrolling="no"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Full Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 flex-shrink-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-0.5">Resume Preview — A4</p>
                <p className="text-sm text-slate-600">Exactly how it will look when printed / downloaded as PDF</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm">
                  <Download size={13} /> Download PDF
                </button>
                <button onClick={() => setShowPreview(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* A4 page wrapper */}
            <div
              ref={previewViewportRef}
              className="flex-1 overflow-y-auto overflow-x-auto bg-slate-200 p-4 sm:p-6 flex justify-center items-start"
            >
              <div
                className="relative my-2"
                style={{
                  width: `${A4_WIDTH * previewScale}px`,
                  height: `${A4_HEIGHT * previewScale}px`,
                }}
              >
                <div
                  className="bg-white border border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.22)]"
                  style={{
                    width: `${A4_WIDTH}px`,
                    height: `${A4_HEIGHT}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <iframe
                    title="A4 Resume Preview"
                    srcDoc={printHtml}
                    className="w-full h-full border-0"
                    scrolling="no"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
