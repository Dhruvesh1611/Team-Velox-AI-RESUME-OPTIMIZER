"use client";

import { useState } from "react";
import { Copy, Check, Lightbulb, TrendingUp, TrendingDown, Eye, Download, X, ExternalLink } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

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

export type JobAlignment = "frontend" | "backend" | "fullstack" | "general";

export interface BuilderResult {
  resumeData: ResumeData | null;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tip: string;
  templateId?: string;
  jobAlignment?: JobAlignment;
}

// ── Resume renderer component ─────────────────────────────────────────────

function ResumeRenderer({ data, compact = false }: { data: ResumeData; compact?: boolean }) {
  const fs = compact ? "text-[9px]" : "text-[10px]";
  const headingBorder = "border-b-2 border-gray-800 pb-0.5 mb-1.5 font-bold uppercase tracking-wider";

  const skillRows = [
    data.skills.frontend && { label: "Frontend", value: data.skills.frontend },
    data.skills.backend && { label: "Backend", value: data.skills.backend },
    data.skills.database && { label: "Database", value: data.skills.database },
    data.skills.tools && { label: "Tools", value: data.skills.tools },
    data.skills.cloud && { label: "Cloud", value: data.skills.cloud },
    data.skills.uiux && { label: "UI/UX Design", value: data.skills.uiux },
    data.skills.languages && { label: "Languages", value: data.skills.languages },
  ].filter(Boolean) as { label: string; value: string }[];

  const priorityOrder: Record<string, number> = {
    internship: 0,
    freelancing: 1,
    fullstack: 2,
    frontend: 3,
    backend: 3,
    opensource: 4,
    other: 5,
  };
  const projects = [...data.projects].sort((a, b) => (priorityOrder[a.type] ?? 5) - (priorityOrder[b.type] ?? 5));

  // Group projects by category
  const grouped: Record<string, typeof projects> = {};
  for (const p of projects) {
    const cat = p.category || p.type.toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
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
          {data.contacts.github && (
            <a
              href={data.contacts.github.startsWith("http") ? data.contacts.github : `https://${data.contacts.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-indigo-700 hover:underline"
            >
              <FaGithub className="inline flex-shrink-0" />
              GitHub
            </a>
          )}
          {data.contacts.linkedin && (
            <a
              href={
                data.contacts.linkedin.startsWith("http")
                  ? data.contacts.linkedin
                  : `https://${data.contacts.linkedin}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[#0A66C2] hover:underline"
            >
              <FaLinkedin className="inline flex-shrink-0" />
              LinkedIn
            </a>
          )}
          {data.contacts.portfolio && (
            <a
              href={
                data.contacts.portfolio.startsWith("http")
                  ? data.contacts.portfolio
                  : `https://${data.contacts.portfolio}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-indigo-700 hover:underline"
            >
              <ExternalLink size={9} className="flex-shrink-0" />
              Portfolio
            </a>
          )}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="flex gap-4">
        {/* LEFT column */}
        <div className="w-[36%] flex-shrink-0 space-y-2.5">
          {/* Achievements / Hackathon */}
          {data.achievements.length > 0 && (
            <div>
              <div className={headingBorder}>Hackathon</div>
              {data.achievements.map((a, i) => (
                <div key={i} className="mb-1">
                  <p className="font-semibold">{a.title}</p>
                  {a.award && <p className="font-bold text-indigo-700">{a.award}</p>}
                </div>
              ))}
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

          {/* Certificates */}
          {data.certificates.length > 0 && (
            <div>
              <div className={headingBorder}>Certificates</div>
              <ul className="space-y-0.5">
                {data.certificates.map((c, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span>•</span>
                    <span>{c.name}</span>
                    {c.link && <ExternalLink size={8} className="text-indigo-500 flex-shrink-0" />}
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
                </div>
              ))}
            </div>
          )}

          {/* Contact Details */}
          <div>
            <div className={headingBorder}>Contact Details</div>
            <div className="space-y-1">
              {data.contacts.phone && <p>☏ {data.contacts.phone}</p>}
              {data.contacts.email && <p>✉ {data.contacts.email}</p>}
              {data.contacts.github && (
                <p className="flex items-center gap-1">
                  <FaGithub className="flex-shrink-0 text-gray-800" />
                  <a
                    href={
                      data.contacts.github.startsWith("http")
                        ? data.contacts.github
                        : `https://${data.contacts.github}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-700 underline break-all"
                  >
                    {data.contacts.github.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
              {data.contacts.linkedin && (
                <p className="flex items-center gap-1">
                  <FaLinkedin className="flex-shrink-0 text-[#0A66C2]" />
                  <a
                    href={
                      data.contacts.linkedin.startsWith("http")
                        ? data.contacts.linkedin
                        : `https://${data.contacts.linkedin}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A66C2] underline break-all"
                  >
                    {data.contacts.linkedin.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
              {data.contacts.portfolio && (
                <p className="flex items-center gap-1">
                  <ExternalLink size={10} className="flex-shrink-0 text-indigo-600" />
                  <a
                    href={
                      data.contacts.portfolio.startsWith("http")
                        ? data.contacts.portfolio
                        : `https://${data.contacts.portfolio}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-700 underline break-all"
                  >
                    {data.contacts.portfolio.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT column — Projects */}
        <div className="flex-1 space-y-2">
          <div className={headingBorder}>Projects</div>
          {Object.entries(grouped).map(([cat, projs]) => (
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
                  {p.description && <p className="italic text-gray-600 mb-0.5">{p.description}</p>}
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
        </div>
      </div>
    </div>
  );
}

// ── Print HTML generator ──────────────────────────────────────────────────

function buildPrintHTML(data: ResumeData, atsScore: number): string {
  const priorityOrder: Record<string, number> = {
    internship: 0,
    freelancing: 1,
    fullstack: 2,
    frontend: 3,
    backend: 3,
    opensource: 4,
    other: 5,
  };
  const projects = [...data.projects].sort((a, b) => (priorityOrder[a.type] ?? 5) - (priorityOrder[b.type] ?? 5));

  const grouped: Record<string, typeof projects> = {};
  for (const p of projects) {
    const cat = p.category || p.type.toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
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

  const projectsHTML = Object.entries(grouped).map(([cat, projs]) => `
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
          ${p.description ? `<p class="proj-desc">${esc(p.description)}</p>` : ""}
          <ul>${p.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
          ${p.technologies ? `<p><strong>Technologies:</strong> ${esc(p.technologies)}</p>` : ""}
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
    .contact-bar a { color:#3730a3; text-decoration:underline; }
    hr { border:none; border-top:1px solid #999; margin:4pt 0; }
    .body { display:flex; gap:14pt; margin-top:4pt; }
    .left { width:36%; flex-shrink:0; }
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
    ${data.contacts.github ? `<a href="${esc(data.contacts.github.startsWith("http") ? data.contacts.github : "https://" + data.contacts.github)}">GitHub</a>` : ""}
    ${data.contacts.linkedin ? `<a href="${esc(data.contacts.linkedin.startsWith("http") ? data.contacts.linkedin : "https://" + data.contacts.linkedin)}">LinkedIn</a>` : ""}
    ${data.contacts.portfolio ? `<a href="${esc(data.contacts.portfolio.startsWith("http") ? data.contacts.portfolio : "https://" + data.contacts.portfolio)}">Portfolio</a>` : ""}
  </div>
  <hr>
  <div class="body">
    <div class="left">
      ${data.achievements.length > 0 ? `
        <div class="section-title">Hackathon</div>
        ${data.achievements.map(a => `
          <div style="margin-bottom:4pt">
            <p class="ach-title">${esc(a.title)}</p>
            ${a.award ? `<p class="ach-award">${esc(a.award)}</p>` : ""}
          </div>`).join("")}` : ""}
      <div class="section-title">Technical Skills</div>
      ${skillRows}
      ${data.certificates.length > 0 ? `
        <div class="section-title">Certificates</div>
        ${data.certificates.map(c => `<p class="cert-item">• ${esc(c.name)}</p>`).join("")}` : ""}
      ${data.education.length > 0 ? `
        <div class="section-title">Education</div>
        ${data.education.map(e => `
          <div style="margin-bottom:4pt">
            <p class="edu-deg">${esc(e.degree)}</p>
            <p>${esc(e.institution)}</p>
            ${e.gpa ? `<p class="edu-gpa">CGPA: ${esc(e.gpa)}</p>` : ""}
            ${e.year ? `<p style="color:#555">${esc(e.year)}</p>` : ""}
            ${e.percentage ? `<p>Percentage: ${esc(e.percentage)}</p>` : ""}
          </div>`).join("")}` : ""}
      <div class="section-title">Contact Details</div>
      ${data.contacts.phone ? `<p>☏ ${esc(data.contacts.phone)}</p>` : ""}
      ${data.contacts.email ? `<p>✉ ${esc(data.contacts.email)}</p>` : ""}
      ${data.contacts.github ? `<p><strong>GitHub:</strong> <a href="${esc(data.contacts.github.startsWith("http") ? data.contacts.github : "https://" + data.contacts.github)}">${esc(data.contacts.github.replace(/^https?:\/\//, ""))}</a></p>` : ""}
      ${data.contacts.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${esc(data.contacts.linkedin.startsWith("http") ? data.contacts.linkedin : "https://" + data.contacts.linkedin)}">${esc(data.contacts.linkedin.replace(/^https?:\/\//, ""))}</a></p>` : ""}
      ${data.contacts.portfolio ? `<p><strong>Portfolio:</strong> <a href="${esc(data.contacts.portfolio.startsWith("http") ? data.contacts.portfolio : "https://" + data.contacts.portfolio)}">${esc(data.contacts.portfolio.replace(/^https?:\/\//, ""))}</a></p>` : ""}
    </div>
    <div class="right">
      <div class="section-title">Projects</div>
      ${projectsHTML}
    </div>
  </div>
</body>
</html>`;
}

// ── Main component ────────────────────────────────────────────────────────

export default function GeneratedResumeCard({ result }: { result: BuilderResult }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const data = result.resumeData;

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
    if (!data) return;
    const html = buildPrintHTML(data, result.atsScore);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
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
          {result.jobAlignment && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
              Projects: {result.jobAlignment}
            </span>
          )}
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

        {/* Inline compact preview */}
        <div className="p-6 overflow-auto max-h-[500px]">
          <ResumeRenderer data={data} compact />
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
            <div className="overflow-auto flex-1 bg-slate-200 p-8 flex justify-center">
              <div
                className="bg-white shadow-xl"
                style={{
                  width: "794px",
                  minHeight: "1123px",
                  padding: "48px 52px",
                }}
              >
                <ResumeRenderer data={data} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
